/*
 * 自动更新模块
 * 
 * 功能说明:
 * - 检查服务器是否有新版本
 * - 后台静默下载更新
 * - 下载安装程序进行更新
 */

#include "updater.h"
#include "config.h"
#include "ui.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <json-c/json.h>
#include <windows.h>
#include <shellapi.h>
#include <process.h>

extern void add_log(const wchar_t *msg);

/*
 * check_for_update - 检查服务器是否有新版本
 * 
 * 参数:
 *   client - HTTP客户端指针，用于发送请求
 *   info   - 输出参数，用于存储版本信息
 * 
 * 返回值:
 *   -1: 请求失败或参数无效
 *    0: 没有新版本
 *    1: 发现新版本，info中包含下载URL
 * 
 * 流程:
 *   1. 参数校验
 *   2. 发送POST请求到更新检查API
 *   3. 解析JSON响应
 *   4. 提取downloadUrl和message字段
 */
int check_for_update(HttpClient *client, VersionInfo *info) {
    if (!client || !info) {
        add_log(L"[check_for_update] 参数无效: client或info为NULL");
        return -1;
    }
    
    memset(info, 0, sizeof(VersionInfo));
    
    char *response = NULL;
    long status_code = 0;
    
    char body[256];
    snprintf(body, sizeof(body), "[\"%s\"]", CURRENT_VERSION);
    
    add_log(L"[check_for_update] 正在发送更新检查请求...");
    
    int ret = http_post_with_client_cookie(client, UPDATE_CHECK_URL, body, &response, &status_code);
    
    if (ret != 0) {
        wchar_t log[256];
        swprintf(log, 256, L"[check_for_update] HTTP请求失败，ret=%d", ret);
        add_log(log);
        if (response) free(response);
        return -1;
    }
    
    if (status_code != 200) {
        wchar_t log[256];
        swprintf(log, 256, L"[check_for_update] HTTP状态码错误: %ld", status_code);
        add_log(log);
        if (response) free(response);
        return -1;
    }
    
    if (!response) {
        add_log(L"[check_for_update] 响应为空");
        return -1;
    }
    
    add_log(L"[check_for_update] 正在解析JSON响应...");
    
    json_object *root = json_tokener_parse(response);
    
    if (!root) {
        add_log(L"[check_for_update] JSON解析失败");
        free(response);
        return -1;
    }
    
    json_object *url_obj, *msg_obj;
    
    if (json_object_object_get_ex(root, "downloadUrl", &url_obj)) {
        const char *url = json_object_get_string(url_obj);
        if (url && strlen(url) > 0) {
            strncpy_s(info->download_url, sizeof(info->download_url), url, _TRUNCATE);
            wchar_t log[512];
            swprintf(log, 512, L"[check_for_update] 下载URL: %S", url);
            add_log(log);
        } else {
            add_log(L"[check_for_update] downloadUrl为空");
        }
    } else {
        add_log(L"[check_for_update] 响应中没有downloadUrl字段");
    }
    
    if (json_object_object_get_ex(root, "message", &msg_obj)) {
        const char *msg = json_object_get_string(msg_obj);
        if (msg) {
            strncpy_s(info->release_notes, sizeof(info->release_notes), msg, _TRUNCATE);
        }
    }
    
    json_object_put(root);
    free(response);
    
    if (info->download_url[0] != '\0') {
        add_log(L"[check_for_update] 发现新版本");
        return 1;
    }
    
    add_log(L"[check_for_update] 没有新版本");
    return 0;
}

static size_t write_file_callback(void *ptr, size_t size, size_t nmemb, void *stream) {
    return fwrite(ptr, size, nmemb, (FILE *)stream);
}

/*
 * download_update - 下载更新安装包
 * 
 * 参数:
 *   client    - HTTP客户端指针，用于获取cookie
 *   url       - 下载URL（相对路径或绝对路径）
 *   save_path - 保存路径（宽字符）
 * 
 * 返回值:
 *   0: 下载成功
 *  -1: 下载失败
 * 
 * 流程:
 *   1. 打开目标文件
 *   2. 初始化CURL
 *   3. 设置cookie（如果有）
 *   4. 执行下载
 *   5. 清理资源
 */
int download_update(HttpClient *client, const char *url, const wchar_t *save_path) {
    if (!client || !url || !save_path) {
        add_log(L"[download_update] 参数无效");
        return -1;
    }
    
    wchar_t log[512];
    swprintf(log, 512, L"[download_update] 开始下载: %S -> %s", url, save_path);
    add_log(log);
    
    FILE *fp = NULL;
    _wfopen_s(&fp, save_path, L"wb");
    if (!fp) {
        wchar_t err_log[256];
        swprintf(err_log, 256, L"[download_update] 无法创建文件: %s (错误码: %lu)", save_path, GetLastError());
        add_log(err_log);
        return -1;
    }
    
    CURL *curl = curl_easy_init();
    if (!curl) {
        add_log(L"[download_update] CURL初始化失败");
        fclose(fp);
        return -1;
    }
    
    struct curl_slist *headers = NULL;
    const char *cookie = http_client_get_cookie(client);
    if (cookie && strlen(cookie) > 0) {
        char cookie_header[1024];
        snprintf(cookie_header, sizeof(cookie_header), "Cookie: %s", cookie);
        headers = curl_slist_append(headers, cookie_header);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        add_log(L"[download_update] 已设置Cookie");
    }
    
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_file_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, fp);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 30L);
    
    add_log(L"[download_update] 正在执行下载...");
    
    CURLcode res = curl_easy_perform(curl);
    
    if (headers) curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    fclose(fp);
    
    if (res != CURLE_OK) {
        wchar_t err_log[256];
        swprintf(err_log, 256, L"[download_update] 下载失败，CURL错误码: %d (%S)", res, curl_easy_strerror(res));
        add_log(err_log);
        DeleteFileW(save_path);
        return -1;
    }
    
    add_log(L"[download_update] 下载成功");
    return 0;
}

typedef struct {
    HttpClient *client;
    HWND hwnd;
} UpdateCheckParams;

/*
 * check_update_background - 后台更新检查线程函数
 * 
 * 参数:
 *   arg - UpdateCheckParams指针，包含client和hwnd
 * 
 * 流程:
 *   1. 解析参数
 *   2. 调用check_for_update检查更新
 *   3. 如果有更新，下载安装包
 *   4. 启动安装程序
 *   5. 创建更新标记文件
 *   6. 关闭当前程序
 */
void check_update_background(void *arg) {
    add_log(L"[check_update_background] 线程启动");
    
    UpdateCheckParams *params = (UpdateCheckParams *)arg;
    if (!params) {
        add_log(L"[check_update_background] 参数为NULL，线程退出");
        _endthread();
        return;
    }
    
    HttpClient *client = params->client;
    HWND hwnd = params->hwnd;
    free(params);
    
    add_log(L"[check_update_background] 参数解析完成，开始检查更新");
    
    VersionInfo info = {0};
    int result = check_for_update(client, &info);
    
    wchar_t log[128];
    swprintf(log, 128, L"[check_update_background] check_for_update返回: %d", result);
    add_log(log);
    
    if (result == 1 && info.download_url[0] != '\0') {
        if (info.release_notes[0] != '\0') {
            wchar_t wmsg[512];
            MultiByteToWideChar(CP_UTF8, 0, info.release_notes, -1, wmsg, 512);
            add_log(wmsg);
        }
        add_log(L"正在后台下载更新...");
        
        wchar_t temp_path[MAX_PATH];
        GetTempPathW(MAX_PATH, temp_path);
        wcscat_s(temp_path, MAX_PATH, L"PrintDriver-Setup.exe");
        
        swprintf(log, 128, L"[check_update_background] 临时文件路径: %s", temp_path);
        add_log(log);
        
        if (download_update(client, info.download_url, temp_path) == 0) {
            add_log(L"更新下载完成，正在安装...");
            
            wchar_t marker_path[MAX_PATH];
            GetTempPathW(MAX_PATH, marker_path);
            wcscat_s(marker_path, MAX_PATH, L"PrintDriver-UpdatePending");
            
            FILE *marker_fp = NULL;
            _wfopen_s(&marker_fp, marker_path, L"w");
            if (marker_fp) {
                fprintf(marker_fp, "%s\n", CURRENT_VERSION);
                fclose(marker_fp);
                swprintf(log, 128, L"[check_update_background] 已创建更新标记文件: %s", marker_path);
                add_log(log);
            } else {
                add_log(L"[check_update_background] 无法创建更新标记文件");
            }
            
            SHELLEXECUTEINFOW sei = {0};
            sei.cbSize = sizeof(sei);
            sei.lpFile = temp_path;
            sei.lpParameters = L"/VERYSILENT /SUPPRESSMSGBOXES";
            sei.nShow = SW_HIDE;
            sei.fMask = SEE_MASK_NOCLOSEPROCESS;
            
            add_log(L"[check_update_background] 正在启动安装程序...");
            
            if (ShellExecuteExW(&sei)) {
                add_log(L"更新安装已启动，程序将退出");
                Sleep(2000);
                PostMessageW(hwnd, WM_CLOSE, 0, 0);
            } else {
                DWORD error = GetLastError();
                wchar_t error_msg[256];
                swprintf(error_msg, 256, L"启动更新程序失败，错误码: %lu", error);
                add_log(error_msg);
                DeleteFileW(marker_path);
            }
        } else {
            add_log(L"更新下载失败");
        }
    } else {
        add_log(L"[check_update_background] 没有需要下载的更新");
    }
    
    add_log(L"[check_update_background] 线程结束");
    _endthread();
}

/*
 * start_update_check - 启动后台更新检查
 * 
 * 参数:
 *   client - HTTP客户端指针
 *   hwnd   - 主窗口句柄，用于发送关闭消息
 * 
 * 返回值:
 *   0: 成功启动线程
 *  -1: 内存分配失败
 * 
 * 说明:
 *   此函数会创建一个后台线程来检查和下载更新，
 *   不会阻塞主线程。更新完成后会自动安装并重启程序。
 */
int start_update_check(HttpClient *client, HWND hwnd) {
    add_log(L"[start_update_check] 开始启动更新检查");
    
    UpdateCheckParams *params = malloc(sizeof(UpdateCheckParams));
    if (!params) {
        add_log(L"[start_update_check] 内存分配失败");
        return -1;
    }
    
    params->client = client;
    params->hwnd = hwnd;
    
    add_log(L"[start_update_check] 正在创建后台线程...");
    
    _beginthread(check_update_background, 0, params);
    
    add_log(L"[start_update_check] 后台线程已创建");
    return 0;
}
