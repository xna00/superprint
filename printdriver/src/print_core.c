/*
 * 核心打印功能实现
 * 
 * 功能说明:
 * - 解压ZIP文件中的JPEG图片
 * - 使用GDI+逐页打印
 * - 兼容所有打印机
 */

#include "print_core.h"
#include "ui.h"
#include <windows.h>
#include <winspool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <gdiplus.h>
#include <objbase.h>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "ole32.lib")

/*
 * 解压ZIP文件到指定目录
 * 使用Shell.Application COM对象
 */
static int extract_zip(const wchar_t *zip_path, const wchar_t *dest_dir) {
    HRESULT hr;
    IShellDispatch *shell = NULL;
    Folder *zip_folder = NULL;
    Folder *dest_folder = NULL;
    FolderItems *items = NULL;
    IDispatch *disp = NULL;
    VARIANT v_src, v_dest, v_opt;
    int result = -1;
    
    hr = CoInitialize(NULL);
    if (FAILED(hr)) {
        add_log(L"COM初始化失败");
        return -1;
    }
    
    VariantInit(&v_opt);
    v_opt.vt = VT_ERROR;
    v_opt.scode = DISP_E_PARAMNOTFOUND;
    
    hr = CoCreateInstance(&CLSID_Shell, NULL, CLSCTX_INPROC_SERVER,
                          &IID_IShellDispatch, (void**)&shell);
    if (FAILED(hr) || !shell) {
        add_log(L"创建Shell对象失败");
        goto cleanup;
    }
    
    hr = shell->lpVtbl->NameSpace(shell, &v_src, &zip_folder);
    if (FAILED(hr) || !zip_folder) {
        add_log(L"打开ZIP文件失败");
        goto cleanup;
    }
    
    hr = shell->lpVtbl->NameSpace(shell, &v_dest, &dest_folder);
    if (FAILED(hr) || !dest_folder) {
        add_log(L"创建目标目录失败");
        goto cleanup;
    }
    
    hr = zip_folder->lpVtbl->Items(zip_folder, &items);
    if (FAILED(hr) || !items) {
        add_log(L"获取ZIP内容失败");
        goto cleanup;
    }
    
    VariantInit(&v_src);
    v_src.vt = VT_DISPATCH;
    v_src.pdispVal = (IDispatch*)items;
    
    hr = dest_folder->lpVtbl->CopyHere(dest_folder, v_src, v_opt);
    if (FAILED(hr)) {
        add_log(L"解压失败");
        goto cleanup;
    }
    
    /* CopyHere是异步的，等待解压完成 */
    for (int i = 0; i < 30; i++) {
        Sleep(500);
        FolderItems *check_items = NULL;
        hr = dest_folder->lpVtbl->Items(dest_folder, &check_items);
        if (SUCCEEDED(hr) && check_items) {
            long count = 0;
            check_items->lpVtbl->get_Count(check_items, &count);
            check_items->lpVtbl->Release(check_items);
            if (count > 0) {
                result = 0;
                break;
            }
        }
    }
    
    if (result != 0) {
        add_log(L"解压超时或失败");
    }

cleanup:
    if (items) items->lpVtbl->Release(items);
    if (zip_folder) zip_folder->lpVtbl->Release(zip_folder);
    if (dest_folder) dest_folder->lpVtbl->Release(dest_folder);
    if (shell) shell->lpVtbl->Release(shell);
    
    CoUninitialize();
    return result;
}

/*
 * 比较函数：按文件名排序
 */
static int compare_jpeg_names(const void *a, const void *b) {
    const wchar_t *name_a = *(const wchar_t**)a;
    const wchar_t *name_b = *(const wchar_t**)b;
    return wcscmp(name_a, name_b);
}

/*
 * 打印单张JPEG图片
 */
static int print_jpeg_page(const wchar_t *jpeg_path, const wchar_t *printer_name, int page_num) {
    HDC hdc_printer = NULL;
    HDC hdc_mem = NULL;
    HBITMAP h_bitmap = NULL;
    HGDIOBJ h_old_bitmap = NULL;
    int result = -1;
    GpImage *image = NULL;
    GpGraphics *graphics = NULL;
    GpStatus status;
    UINT img_width, img_height;
    int paper_width, paper_height;
    double scale_x, scale_y, scale;
    int draw_w, draw_h, draw_x, draw_y;
    
    /* 加载JPEG */
    status = GdipLoadImageFromFile((GDIPCONST WCHAR*)jpeg_path, &image);
    if (status != Ok || !image) {
        wchar_t log[512];
        swprintf(log, 512, L"第%d页：加载JPEG失败 (GDI+ %d)", page_num, status);
        add_log(log);
        return -1;
    }
    
    GdipGetImageWidth(image, &img_width);
    GdipGetImageHeight(image, &img_height);
    
    /* 打开打印机 */
    HANDLE h_printer;
    if (!OpenPrinterW((LPWSTR)printer_name, &h_printer, NULL)) {
        add_log(L"打开打印机失败");
        GdipDisposeImage(image);
        return -1;
    }
    
    /* 开始打印文档 */
    DOC_INFO_1W doc_info;
    memset(&doc_info, 0, sizeof(doc_info));
    doc_info.pDocName = L"PrintJob";
    doc_info.pDatatype = L"RAW";
    
    DWORD job_id = StartDocPrinterW(h_printer, 1, (LPBYTE)&doc_info);
    if (job_id == 0) {
        add_log(L"开始打印文档失败");
        ClosePrinter(h_printer);
        GdipDisposeImage(image);
        return -1;
    }
    
    StartPagePrinter(h_printer);
    
    /* 获取打印机DC */
    hdc_printer = CreateDCW(NULL, printer_name, NULL, NULL);
    if (!hdc_printer) {
        add_log(L"创建打印机DC失败");
        goto end_print;
    }
    
    /* 获取纸张大小（像素） */
    paper_width = GetDeviceCaps(hdc_printer, HORZRES);
    paper_height = GetDeviceCaps(hdc_printer, VERTRES);
    
    /* 计算缩放比例，保持纵横比 */
    scale_x = (double)paper_width / img_width;
    scale_y = (double)paper_height / img_height;
    scale = (scale_x < scale_y) ? scale_x : scale_y;
    
    draw_w = (int)(img_width * scale);
    draw_h = (int)(img_height * scale);
    draw_x = (paper_width - draw_w) / 2;
    draw_y = (paper_height - draw_h) / 2;
    
    /* 创建内存DC和位图 */
    hdc_mem = CreateCompatibleDC(hdc_printer);
    if (!hdc_mem) {
        add_log(L"创建内存DC失败");
        goto end_print;
    }
    
    h_bitmap = CreateCompatibleBitmap(hdc_printer, img_width, img_height);
    if (!h_bitmap) {
        add_log(L"创建位图失败");
        goto end_print;
    }
    
    h_old_bitmap = SelectObject(hdc_mem, h_bitmap);
    
    /* 用GDI+绘制到内存DC */
    status = GdipCreateFromHDC(hdc_mem, &graphics);
    if (status != Ok) {
        add_log(L"创建GDI+ Graphics失败");
        goto end_print;
    }
    
    status = GdipDrawImageRect(graphics, image, 0, 0, img_width, img_height);
    if (status != Ok) {
        add_log(L"GDI+绘制失败");
        goto end_print;
    }
    
    /* 缩放打印到打印机DC */
    SetStretchBltMode(hdc_printer, HALFTONE);
    if (!StretchBlt(hdc_printer, draw_x, draw_y, draw_w, draw_h,
                    hdc_mem, 0, 0, img_width, img_height, SRCCOPY)) {
        add_log(L"StretchBlt失败");
        goto end_print;
    }
    
    result = 0;

end_print:
    if (graphics) GdipDeleteGraphics(graphics);
    if (h_old_bitmap) SelectObject(hdc_mem, h_old_bitmap);
    if (h_bitmap) DeleteObject(h_bitmap);
    if (hdc_mem) DeleteDC(hdc_mem);
    if (hdc_printer) DeleteDC(hdc_printer);
    
    EndPagePrinter(h_printer);
    EndDocPrinter(h_printer);
    ClosePrinter(h_printer);
    
    GdipDisposeImage(image);
    
    if (result == 0) {
        wchar_t log[128];
        swprintf(log, 128, L"第%d页打印完成", page_num);
        add_log(log);
    }
    
    return result;
}

/*
 * 递归删除目录
 */
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

/*
 * 打印ZIP文件（解压后逐页打印JPEG）
 * @param file_path ZIP文件路径
 * @param printer_name 打印机名称，如果为NULL或空则使用默认打印机
 * @return 0成功，-1失败
 */
int print_file(const char *file_path, const char *printer_name) {
    wchar_t w_printer_name[256];
    wchar_t w_zip_path[MAX_PATH];
    wchar_t temp_dir[MAX_PATH];
    DWORD buf_size = sizeof(w_printer_name);
    int result = -1;
    GdiplusStartupInput gdiplus_startup_input;
    ULONG_PTR gdiplus_token = 0;
    
    /* 初始化GDI+ */
    gdiplus_startup_input.GdiplusVersion = 1;
    gdiplus_startup_input.DebugEventCallback = NULL;
    gdiplus_startup_input.SuppressBackgroundThread = FALSE;
    if (GdiplusStartup(&gdiplus_token, &gdiplus_startup_input, NULL) != Ok) {
        add_log(L"GDI+初始化失败");
        return -1;
    }
    
    /* 获取打印机名称 */
    if (printer_name && printer_name[0] != '\0') {
        MultiByteToWideChar(CP_UTF8, 0, printer_name, -1, w_printer_name, 256);
    } else {
        if (!GetDefaultPrinterW(w_printer_name, &buf_size)) {
            add_log(L"获取默认打印机失败");
            GdiplusShutdown(gdiplus_token);
            return -1;
        }
    }
    
    /* 转换ZIP路径 */
    MultiByteToWideChar(CP_UTF8, 0, file_path, -1, w_zip_path, MAX_PATH);
    
    /* 创建临时目录 */
    GetTempPathW(MAX_PATH, temp_dir);
    wchar_t unique_dir[MAX_PATH];
    swprintf(unique_dir, MAX_PATH, L"%sprint_%lu", temp_dir, GetTickCount());
    CreateDirectoryW(unique_dir, NULL);
    
    wchar_t log[512];
    swprintf(log, 512, L"开始解压ZIP: %s", w_zip_path);
    add_log(log);
    
    /* 解压ZIP */
    if (extract_zip(w_zip_path, unique_dir) != 0) {
        add_log(L"ZIP解压失败");
        delete_directory_recursive(unique_dir);
        GdiplusShutdown(gdiplus_token);
        return -1;
    }
    
    add_log(L"ZIP解压成功，开始打印");
    
    /* 枚举所有page-*.jpg文件 */
    WIN32_FIND_DATAW find_data;
    wchar_t search_path[MAX_PATH];
    swprintf(search_path, MAX_PATH, L"%s\\page-*.jpg", unique_dir);
    
    HANDLE h_find = FindFirstFileW(search_path, &find_data);
    if (h_find == INVALID_HANDLE_VALUE) {
        add_log(L"未找到JPEG文件");
        delete_directory_recursive(unique_dir);
        GdiplusShutdown(gdiplus_token);
        return -1;
    }
    
    /* 收集所有文件名 */
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
    
    /* 排序 */
    qsort(file_names, file_count, sizeof(wchar_t*), compare_jpeg_names);
    
    /* 逐页打印 */
    int success_count = 0;
    for (int i = 0; i < file_count; i++) {
        wchar_t full_path[MAX_PATH];
        swprintf(full_path, MAX_PATH, L"%s\\%s", unique_dir, file_names[i]);
        
        if (print_jpeg_page(full_path, w_printer_name, i + 1) == 0) {
            success_count++;
        }
        
        free(file_names[i]);
    }
    
    if (success_count == file_count) {
        result = 0;
        swprintf(log, 512, L"打印任务已完成 (%d/%d 页)", success_count, file_count);
    } else {
        swprintf(log, 512, L"打印任务部分完成 (%d/%d 页)", success_count, file_count);
    }
    add_log(log);
    
    /* 清理临时目录 */
    delete_directory_recursive(unique_dir);
    
    GdiplusShutdown(gdiplus_token);
    return result;
}
