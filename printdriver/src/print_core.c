/*
 * 核心打印功能实现
 * 
 * 功能说明:
 * - 使用XPS Print API打印XPS文档
 * - 兼容GDI和XPSDrv打印机驱动
 * - XPS文件内嵌PrintTicket支持双面打印
 */

#include "print_core.h"
#include "ui.h"
#include <winspool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <objbase.h>
#include <xpsprint.h>

#pragma comment(lib, "xpsprint.lib")

/*
 * 打印XPS文件到指定打印机
 * 使用XPS Print API (IXpsPrintJob)
 * @param file_path XPS文件路径
 * @param printer_name 打印机名称，如果为NULL或空则使用默认打印机
 * @return 0成功，-1失败
 */
int print_file(const char *file_path, const char *printer_name) {
    HRESULT hr = S_OK;
    HANDLE completionEvent = NULL;
    IXpsPrintJob *job = NULL;
    IXpsPrintJobStream *jobStream = NULL;
    wchar_t w_printer_name[256];
    wchar_t w_file_path[MAX_PATH];
    DWORD buf_size = sizeof(w_printer_name);
    int result = -1;
    FILE *fp = NULL;
    
    if (printer_name && printer_name[0] != '\0') {
        MultiByteToWideChar(CP_UTF8, 0, printer_name, -1, w_printer_name, 256);
    } else {
        if (!GetDefaultPrinterW(w_printer_name, &buf_size)) {
            add_log(L"获取默认打印机失败");
            return -1;
        }
    }
    
    MultiByteToWideChar(CP_UTF8, 0, file_path, -1, w_file_path, MAX_PATH);
    
    hr = CoInitialize(NULL);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"COM初始化失败: 0x%08X", hr);
        add_log(log);
        return -1;
    }
    
    completionEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    if (!completionEvent) {
        add_log(L"创建完成事件失败");
        goto cleanup;
    }
    
    hr = StartXpsPrintJob(
        w_printer_name,
        L"PrintJob",
        NULL,
        NULL,
        completionEvent,
        NULL,
        0,
        &job,
        &jobStream,
        NULL
    );
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"启动XPS打印任务失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    fp = _wfopen(w_file_path, L"rb");
    if (!fp) {
        add_log(L"打开XPS文件失败");
        goto cleanup;
    }
    
    fseek(fp, 0, SEEK_END);
    long file_size = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    
    BYTE buffer[8192];
    ULONG bytesRead, bytesWritten;
    long remaining = file_size;
    
    while (remaining > 0) {
        ULONG toRead = (remaining > (long)sizeof(buffer)) ? sizeof(buffer) : (ULONG)remaining;
        bytesRead = (ULONG)fread(buffer, 1, toRead, fp);
        if (bytesRead == 0) break;
        
        hr = jobStream->lpVtbl->Write(jobStream, buffer, bytesRead, &bytesWritten);
        if (FAILED(hr)) {
            wchar_t log[128];
            swprintf(log, 128, L"写入打印流失败: 0x%08X", hr);
            add_log(log);
            goto cleanup;
        }
        
        remaining -= bytesRead;
    }
    
    fclose(fp);
    fp = NULL;
    
    hr = jobStream->lpVtbl->Close(jobStream);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"关闭打印流失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    if (WaitForSingleObject(completionEvent, INFINITE) != WAIT_OBJECT_0) {
        add_log(L"等待打印完成超时");
        goto cleanup;
    }
    
    XPS_JOB_STATUS jobStatus;
    hr = job->lpVtbl->GetJobStatus(job, &jobStatus);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"获取打印状态失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    switch (jobStatus.completion) {
        case XPS_JOB_COMPLETED:
            add_log(L"XPS打印任务已完成");
            result = 0;
            break;
        case XPS_JOB_CANCELLED:
            add_log(L"XPS打印任务已取消");
            break;
        case XPS_JOB_FAILED:
            {
                wchar_t log[128];
                swprintf(log, 128, L"XPS打印任务失败: 0x%08X", jobStatus.jobStatus);
                add_log(log);
            }
            break;
        default:
            add_log(L"XPS打印任务意外状态");
            break;
    }

cleanup:
    if (fp) fclose(fp);
    if (jobStream) jobStream->lpVtbl->Release(jobStream);
    if (job) job->lpVtbl->Release(job);
    if (completionEvent) CloseHandle(completionEvent);
    
    CoUninitialize();
    
    return result;
}
