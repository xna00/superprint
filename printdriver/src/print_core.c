/*
 * 核心打印功能实现
 * 
 * 功能说明:
 * - 解压ZIP文件中的JPEG图片
 * - 使用WIC加载JPEG，GDI打印
 * - 支持双面打印设置
 * - 兼容所有打印机
 */

#include "print_core.h"
#include "ui.h"
#include <windows.h>
#include <winspool.h>
#include <shlwapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <wincodec.h>
#include <miniz/miniz.h>

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "windowscodecs.lib")
#pragma comment(lib, "shlwapi.lib")

static IWICImagingFactory *g_wic_factory = NULL;

static int init_wic_factory(void) {
    if (g_wic_factory) return 0;
    
    HRESULT hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);
    if (FAILED(hr) && hr != RPC_E_CHANGED_MODE) {
        return -1;
    }
    
    hr = CoCreateInstance(&CLSID_WICImagingFactory, NULL, CLSCTX_INPROC_SERVER,
                          &IID_IWICImagingFactory, (void**)&g_wic_factory);
    if (FAILED(hr)) {
        g_wic_factory = NULL;
        return -1;
    }
    
    return 0;
}

static DEVMODEW *get_printer_devmode(const wchar_t *printer_name) {
    HANDLE hPrinter = NULL;
    DEVMODEW *pDevMode = NULL;
    
    if (!OpenPrinterW((LPWSTR)printer_name, &hPrinter, NULL)) {
        return NULL;
    }
    
    DWORD needed = 0;
    GetPrinterW(hPrinter, 2, NULL, 0, &needed);
    if (needed == 0) {
        ClosePrinter(hPrinter);
        return NULL;
    }
    
    PRINTER_INFO_2W *pPrinterInfo = (PRINTER_INFO_2W *)malloc(needed);
    if (!pPrinterInfo) {
        ClosePrinter(hPrinter);
        return NULL;
    }
    
    if (!GetPrinterW(hPrinter, 2, (LPBYTE)pPrinterInfo, needed, &needed)) {
        free(pPrinterInfo);
        ClosePrinter(hPrinter);
        return NULL;
    }
    
    if (pPrinterInfo->pDevMode) {
        DWORD devModeSize = pPrinterInfo->pDevMode->dmSize + pPrinterInfo->pDevMode->dmDriverExtra;
        pDevMode = (DEVMODEW *)malloc(devModeSize);
        if (pDevMode) {
            memcpy(pDevMode, pPrinterInfo->pDevMode, devModeSize);
        }
    }
    
    free(pPrinterInfo);
    ClosePrinter(hPrinter);
    return pDevMode;
}

static int extract_zip(const wchar_t *zip_path, const wchar_t *dest_dir) {
    char zip_path_utf8[MAX_PATH];
    char dest_dir_utf8[MAX_PATH];
    
    WideCharToMultiByte(CP_UTF8, 0, zip_path, -1, zip_path_utf8, MAX_PATH, NULL, NULL);
    WideCharToMultiByte(CP_UTF8, 0, dest_dir, -1, dest_dir_utf8, MAX_PATH, NULL, NULL);
    
    if (!PathFileExistsW(zip_path)) {
        wchar_t log[512];
        swprintf(log, 512, L"ZIP文件不存在: %s", zip_path);
        add_log(log);
        return -1;
    }
    
    CreateDirectoryW(dest_dir, NULL);
    
    mz_zip_archive zip = {0};
    if (!mz_zip_reader_init_file(&zip, zip_path_utf8, 0)) {
        wchar_t log[256];
        swprintf(log, 256, L"打开ZIP文件失败: %s", zip_path);
        add_log(log);
        return -1;
    }
    
    int file_count = (int)mz_zip_reader_get_num_files(&zip);
    if (file_count == 0) {
        mz_zip_reader_end(&zip);
        add_log(L"ZIP文件为空");
        return -1;
    }
    
    int extracted = 0;
    for (int i = 0; i < file_count; i++) {
        mz_zip_archive_file_stat file_stat;
        if (!mz_zip_reader_file_stat(&zip, i, &file_stat)) {
            continue;
        }
        
        if (file_stat.m_is_directory) {
            continue;
        }
        
        char output_path[MAX_PATH * 2];
        snprintf(output_path, sizeof(output_path), "%s/%s", dest_dir_utf8, file_stat.m_filename);
        
        for (char *p = output_path + strlen(dest_dir_utf8) + 1; *p; p++) {
            if (*p == '/') {
                *p = '\0';
                CreateDirectoryA(output_path, NULL);
                *p = '\\';
            }
        }
        
        for (char *p = output_path + strlen(dest_dir_utf8) + 1; *p; p++) {
            if (*p == '/') *p = '\\';
        }
        
        if (mz_zip_reader_extract_to_file(&zip, i, output_path, 0)) {
            extracted++;
        }
    }
    
    mz_zip_reader_end(&zip);
    
    if (extracted == 0) {
        add_log(L"解压失败，没有文件被提取");
        return -1;
    }
    
    wchar_t log[256];
    swprintf(log, 256, L"解压完成，提取了 %d 个文件", extracted);
    add_log(log);
    
    return 0;
}

static int compare_jpeg_names(const void *a, const void *b) {
    const wchar_t *name_a = *(const wchar_t**)a;
    const wchar_t *name_b = *(const wchar_t**)b;
    return wcscmp(name_a, name_b);
}

static HBITMAP load_jpeg_with_wic(const wchar_t *jpeg_path, int *width, int *height) {
    if (!g_wic_factory) return NULL;
    
    IWICBitmapDecoder *decoder = NULL;
    IWICBitmapFrameDecode *frame = NULL;
    IWICFormatConverter *converter = NULL;
    IWICBitmapSource *source = NULL;
    HBITMAP hBitmap = NULL;
    void *bits = NULL;
    
    HRESULT hr = g_wic_factory->lpVtbl->CreateDecoderFromFilename(
        g_wic_factory, jpeg_path, NULL, GENERIC_READ,
        WICDecodeMetadataCacheOnDemand, &decoder);
    
    if (FAILED(hr) || !decoder) {
        return NULL;
    }
    
    hr = decoder->lpVtbl->GetFrame(decoder, 0, &frame);
    if (FAILED(hr) || !frame) {
        decoder->lpVtbl->Release(decoder);
        return NULL;
    }
    
    UINT w = 0, h = 0;
    hr = frame->lpVtbl->GetSize(frame, &w, &h);
    if (FAILED(hr) || w == 0 || h == 0) {
        frame->lpVtbl->Release(frame);
        decoder->lpVtbl->Release(decoder);
        return NULL;
    }
    
    hr = g_wic_factory->lpVtbl->CreateFormatConverter(g_wic_factory, &converter);
    if (FAILED(hr) || !converter) {
        frame->lpVtbl->Release(frame);
        decoder->lpVtbl->Release(decoder);
        return NULL;
    }
    
    hr = converter->lpVtbl->Initialize(converter, (IWICBitmapSource*)frame,
        &GUID_WICPixelFormat32bppPBGRA, WICBitmapDitherTypeNone, NULL, 0.0, WICBitmapPaletteTypeCustom);
    
    if (FAILED(hr)) {
        converter->lpVtbl->Release(converter);
        frame->lpVtbl->Release(frame);
        decoder->lpVtbl->Release(decoder);
        return NULL;
    }
    
    HDC hdcScreen = GetDC(NULL);
    HDC hdcMem = CreateCompatibleDC(hdcScreen);
    
    BITMAPINFO bmi = {0};
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = w;
    bmi.bmiHeader.biHeight = -(LONG)h;
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32;
    bmi.bmiHeader.biCompression = BI_RGB;
    
    hBitmap = CreateDIBSection(hdcScreen, &bmi, DIB_RGB_COLORS, &bits, NULL, 0);
    if (!hBitmap || !bits) {
        ReleaseDC(NULL, hdcScreen);
        DeleteDC(hdcMem);
        converter->lpVtbl->Release(converter);
        frame->lpVtbl->Release(frame);
        decoder->lpVtbl->Release(decoder);
        return NULL;
    }
    
    UINT stride = w * 4;
    UINT buf_size = stride * h;
    
    hr = converter->lpVtbl->CopyPixels(converter, NULL, stride, buf_size, bits);
    if (FAILED(hr)) {
        DeleteObject(hBitmap);
        ReleaseDC(NULL, hdcScreen);
        DeleteDC(hdcMem);
        converter->lpVtbl->Release(converter);
        frame->lpVtbl->Release(frame);
        decoder->lpVtbl->Release(decoder);
        return NULL;
    }
    
    ReleaseDC(NULL, hdcScreen);
    DeleteDC(hdcMem);
    
    converter->lpVtbl->Release(converter);
    frame->lpVtbl->Release(frame);
    decoder->lpVtbl->Release(decoder);
    
    *width = w;
    *height = h;
    return hBitmap;
}

static int print_jpeg_page(HDC hdc_printer, const wchar_t *jpeg_path, int page_num, int total_pages) {
    HBITMAP hBitmap = NULL;
    HDC hdc_mem = NULL;
    HGDIOBJ h_old_bitmap = NULL;
    int img_width, img_height;
    int paper_width, paper_height;
    double scale_x, scale_y, scale;
    int draw_w, draw_h, draw_x, draw_y;
    int result = -1;
    
    hBitmap = load_jpeg_with_wic(jpeg_path, &img_width, &img_height);
    if (!hBitmap) {
        wchar_t log[512];
        swprintf(log, 512, L"第%d页：加载JPEG失败", page_num);
        add_log(log);
        return -1;
    }
    
    paper_width = GetDeviceCaps(hdc_printer, HORZRES);
    paper_height = GetDeviceCaps(hdc_printer, VERTRES);
    
    scale_x = (double)paper_width / img_width;
    scale_y = (double)paper_height / img_height;
    scale = (scale_x < scale_y) ? scale_x : scale_y;
    
    draw_w = (int)(img_width * scale);
    draw_h = (int)(img_height * scale);
    draw_x = (paper_width - draw_w) / 2;
    draw_y = (paper_height - draw_h) / 2;
    
    hdc_mem = CreateCompatibleDC(hdc_printer);
    if (!hdc_mem) {
        add_log(L"创建内存DC失败");
        goto cleanup;
    }
    
    h_old_bitmap = SelectObject(hdc_mem, hBitmap);
    
    SetStretchBltMode(hdc_printer, HALFTONE);
    SetBrushOrgEx(hdc_printer, 0, 0, NULL);
    
    if (!StretchBlt(hdc_printer, draw_x, draw_y, draw_w, draw_h,
                    hdc_mem, 0, 0, img_width, img_height, SRCCOPY)) {
        add_log(L"StretchBlt失败");
        goto cleanup;
    }
    
    result = 0;

cleanup:
    if (h_old_bitmap) SelectObject(hdc_mem, h_old_bitmap);
    if (hdc_mem) DeleteDC(hdc_mem);
    if (hBitmap) DeleteObject(hBitmap);
    
    if (result == 0) {
        wchar_t log[128];
        swprintf(log, 128, L"第%d/%d页打印完成", page_num, total_pages);
        add_log(log);
    }
    
    return result;
}

static void delete_directory_recursive(const wchar_t *path) {
    WIN32_FIND_DATAW find_data;
    wchar_t search_path[MAX_PATH];
    wchar_t full_path[MAX_PATH];
    HANDLE h_find;
    
    swprintf(search_path, MAX_PATH, L"%s\\*", path);
    
    h_find = FindFirstFileW(search_path, &find_data);
    if (h_find == INVALID_HANDLE_VALUE) {
        RemoveDirectoryW(path);
        return;
    }
    
    do {
        if (wcscmp(find_data.cFileName, L".") == 0 || wcscmp(find_data.cFileName, L"..") == 0)
            continue;
        
        swprintf(full_path, MAX_PATH, L"%s\\%s", path, find_data.cFileName);
        
        if (find_data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            delete_directory_recursive(full_path);
        } else {
            DeleteFileW(full_path);
        }
    } while (FindNextFileW(h_find, &find_data));
    
    FindClose(h_find);
    RemoveDirectoryW(path);
}

int print_file(const char *file_path, const char *printer_name, int duplex, int tumble) {
    wchar_t w_printer_name[256];
    wchar_t w_zip_path[MAX_PATH];
    wchar_t temp_dir[MAX_PATH];
    DWORD buf_size = sizeof(w_printer_name);
    int result = -1;
    HDC hdc_printer = NULL;
    DEVMODEW *pDevMode = NULL;
    DOCINFOW doc_info = {0};
    
    if (init_wic_factory() != 0) {
        add_log(L"WIC初始化失败");
        return -1;
    }
    
    if (printer_name && printer_name[0] != '\0') {
        MultiByteToWideChar(CP_UTF8, 0, printer_name, -1, w_printer_name, 256);
    } else {
        if (!GetDefaultPrinterW(w_printer_name, &buf_size)) {
            add_log(L"获取默认打印机失败");
            return -1;
        }
    }
    
    MultiByteToWideChar(CP_UTF8, 0, file_path, -1, w_zip_path, MAX_PATH);
    
    pDevMode = get_printer_devmode(w_printer_name);
    if (pDevMode) {
        pDevMode->dmFields |= DM_DUPLEX;
        if (duplex) {
            pDevMode->dmDuplex = tumble ? DMDUP_HORIZONTAL : DMDUP_VERTICAL;
        } else {
            pDevMode->dmDuplex = DMDUP_SIMPLEX;
        }
    }
    
    GetTempPathW(MAX_PATH, temp_dir);
    wchar_t unique_dir[MAX_PATH];
    swprintf(unique_dir, MAX_PATH, L"%sprint_%lu", temp_dir, GetTickCount());
    CreateDirectoryW(unique_dir, NULL);
    
    wchar_t log[512];
    swprintf(log, 512, L"开始解压ZIP: %s", w_zip_path);
    add_log(log);
    
    if (extract_zip(w_zip_path, unique_dir) != 0) {
        add_log(L"ZIP解压失败");
        delete_directory_recursive(unique_dir);
        if (pDevMode) free(pDevMode);
        return -1;
    }
    
    add_log(L"ZIP解压成功，开始打印");
    
    wchar_t search_path[MAX_PATH];
    swprintf(search_path, MAX_PATH, L"%s\\page-*.jpg", unique_dir);
    
    WIN32_FIND_DATAW find_data;
    HANDLE h_find = FindFirstFileW(search_path, &find_data);
    if (h_find == INVALID_HANDLE_VALUE) {
        add_log(L"未找到JPEG文件");
        delete_directory_recursive(unique_dir);
        if (pDevMode) free(pDevMode);
        return -1;
    }
    
    wchar_t *file_names[100];
    int file_count = 0;
    
    do {
        if (file_count < 100) {
            file_names[file_count] = (wchar_t*)malloc((wcslen(find_data.cFileName) + 1) * sizeof(wchar_t));
            if (file_names[file_count]) {
                wcscpy(file_names[file_count], find_data.cFileName);
                file_count++;
            }
        }
    } while (FindNextFileW(h_find, &find_data) && file_count < 100);
    
    FindClose(h_find);
    
    if (file_count == 0) {
        add_log(L"没有找到可打印的页面");
        delete_directory_recursive(unique_dir);
        if (pDevMode) free(pDevMode);
        return -1;
    }
    
    qsort(file_names, file_count, sizeof(wchar_t*), compare_jpeg_names);
    
    hdc_printer = CreateDCW(NULL, w_printer_name, NULL, pDevMode);
    if (!hdc_printer) {
        add_log(L"创建打印机DC失败");
        goto cleanup_files;
    }
    
    doc_info.cbSize = sizeof(DOCINFOW);
    doc_info.lpszDocName = L"PrintJob";
    
    if (StartDocW(hdc_printer, &doc_info) <= 0) {
        add_log(L"开始打印文档失败");
        goto cleanup_dc;
    }
    
    int success_count = 0;
    for (int i = 0; i < file_count; i++) {
        wchar_t full_path[MAX_PATH];
        swprintf(full_path, MAX_PATH, L"%s\\%s", unique_dir, file_names[i]);
        
        if (StartPage(hdc_printer) > 0) {
            if (print_jpeg_page(hdc_printer, full_path, i + 1, file_count) == 0) {
                success_count++;
            }
            EndPage(hdc_printer);
        }
    }
    
    EndDoc(hdc_printer);
    
    if (success_count == file_count) {
        result = 0;
        swprintf(log, 512, L"打印任务已完成 (%d/%d 页)", success_count, file_count);
    } else {
        swprintf(log, 512, L"打印任务部分完成 (%d/%d 页)", success_count, file_count);
    }
    add_log(log);

cleanup_dc:
    if (hdc_printer) DeleteDC(hdc_printer);

cleanup_files:
    for (int i = 0; i < file_count; i++) {
        free(file_names[i]);
    }
    
    delete_directory_recursive(unique_dir);
    
    if (pDevMode) free(pDevMode);
    
    return result;
}
