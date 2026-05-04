/*
 * 核心打印功能实现
 * 
 * 功能说明:
 * - 使用XPS Print API打印XPS文档
 * - 兼容GDI和XPSDrv打印机驱动
 */

#include "print_core.h"
#include "ui.h"
#include <winspool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <objbase.h>
#include <xpsprint.h>

/* IXpsPrintJobStream IID 修复（微软头文件中的IID有误） */
MIDL_INTERFACE("7a77dc5f-45d6-4dff-9307-d8cb846347ca") IXpsPrintJobStreamFixed : IUnknown {
    virtual HRESULT STDMETHODCALLTYPE Read(
        void *pv,
        ULONG cb,
        ULONG *pcbRead) = 0;
    
    virtual HRESULT STDMETHODCALLTYPE Write(
        const void *pv,
        ULONG cb,
        ULONG *pcbWritten) = 0;
    
    virtual HRESULT STDMETHODCALLTYPE Close(void) = 0;
};

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
    IStream *jobStream = NULL;
    IXpsOMObjectFactory *xpsFactory = NULL;
    IXpsOMPackage *package = NULL;
    wchar_t w_printer_name[256];
    wchar_t w_file_path[MAX_PATH];
    DWORD buf_size = sizeof(w_printer_name);
    int result = -1;
    
    /* 获取打印机名称 */
    if (printer_name && printer_name[0] != '\0') {
        MultiByteToWideChar(CP_UTF8, 0, printer_name, -1, w_printer_name, 256);
    } else {
        if (!GetDefaultPrinterW(w_printer_name, &buf_size)) {
            add_log(L"获取默认打印机失败");
            return -1;
        }
    }
    
    /* 转换文件路径 */
    MultiByteToWideChar(CP_UTF8, 0, file_path, -1, w_file_path, MAX_PATH);
    
    /* 1. COM 初始化 */
    hr = CoInitialize(NULL);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"COM初始化失败: 0x%08X", hr);
        add_log(log);
        return -1;
    }
    
    /* 2. 创建完成事件 */
    completionEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
    if (!completionEvent) {
        add_log(L"创建完成事件失败");
        goto cleanup;
    }
    
    /* 3. 启动XPS打印任务 */
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
    
    /* 4. 创建XPS OM工厂并加载文件 */
    hr = CoCreateInstance(
        &CLSID_XpsOMObjectFactory,
        NULL,
        CLSCTX_INPROC_SERVER,
        &IID_IXpsOMObjectFactory,
        (void **)&xpsFactory
    );
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"创建XPS OM工厂失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    hr = xpsFactory->lpVtbl->CreatePackageFromFile(xpsFactory, w_file_path, FALSE, &package);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"加载XPS文件失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    /* 5. 将XPS文档写入打印流 */
    hr = package->lpVtbl->WriteToStream(package, jobStream, FALSE);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"写入XPS打印流失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    /* 6. 关闭打印流 */
    hr = jobStream->lpVtbl->Close(jobStream);
    if (FAILED(hr)) {
        wchar_t log[128];
        swprintf(log, 128, L"关闭打印流失败: 0x%08X", hr);
        add_log(log);
        goto cleanup;
    }
    
    /* 7. 等待打印完成 */
    if (WaitForSingleObject(completionEvent, INFINITE) != WAIT_OBJECT_0) {
        add_log(L"等待打印完成超时");
        goto cleanup;
    }
    
    /* 8. 检查打印状态 */
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
    /* 9. 清理资源 */
    if (package) package->lpVtbl->Release(package);
    if (xpsFactory) xpsFactory->lpVtbl->Release(xpsFactory);
    if (jobStream) jobStream->lpVtbl->Release(jobStream);
    if (job) job->lpVtbl->Release(job);
    if (completionEvent) CloseHandle(completionEvent);
    
    CoUninitialize();
    
    return result;
}
