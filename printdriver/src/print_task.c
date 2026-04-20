/*
 * 打印文件实现
 * 
 * 功能说明:
 * - 从服务器获取待打印的文件列表
 * - 通知服务器打印完成
 */

#include "print_task.h"
#include "http_client.h"
#include "config.h"
#include "ui.h"
#include <json-c/json.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * 获取等待中的打印文件列表
 * 从服务器API获取待打印文件
 * 使用POST请求
 */
int get_waiting_print_files(HttpClient *client, const char *computer_id, PrintFileInfo **files, int *count) {
    char *response = NULL;
    long status_code = 0;
    
    /* 构建过滤参数JSON */
    char json_body[512];
    if (computer_id && computer_id[0] != '\0') {
        snprintf(json_body, sizeof(json_body), 
            "[{\"state\": \"waiting_print\", \"computerId\": \"%s\"}]", 
            computer_id);
    } else {
        snprintf(json_body, sizeof(json_body), 
            "[{\"state\": \"waiting_print\"}]");
    }
    
    /* 发送带Cookie的POST请求 */
    int ret = http_post_with_client_cookie(client, API_LIST_PRINTTASKS, json_body, &response, &status_code);
    
    if (ret != 0 || status_code != 200 || !response) {
        add_log(L"获取待打印文件失败");
        return -1;
    }
    
    /* 解析JSON响应 */
    json_object *root = parse_json_response(response);
    if (!root) {
        add_log(L"解析JSON响应失败");
        wchar_t wresponse[512];
        MultiByteToWideChar(CP_UTF8, 0, response, -1, wresponse, 512);
        swprintf_s(wresponse, 512, L"响应内容: %d", strlen(wresponse));
        add_log(wresponse);
        free(response);
        return -1;
    }
    
    /* 获取printTasks数组 - 响应直接是数组，不是对象 */
    json_object *tasks_array = NULL;
    json_type root_type = json_object_get_type(root);
    
    if (root_type == json_type_array) {
        /* 响应直接是数组 */
        tasks_array = root;
    } else {
        /* 响应是对象，尝试获取printTasks字段 */
        if (!json_object_object_get_ex(root, "printTasks", &tasks_array)) {
            add_log(L"响应中没有printTasks字段");
            json_object_put(root);
            free(response);
            *count = 0;
            return 0;
        }
    }
    
    int array_len = json_object_array_length(tasks_array);
    if (array_len == 0) {
        add_log(L"没有找到打印任务");
        json_object_put(root);
        free(response);
        *count = 0;
        return 0;
    }
    
    /* 计算最大可能的文件数量 */
    int max_files = 0;
    for (int i = 0; i < array_len; i++) {
        json_object *task = json_object_array_get_idx(tasks_array, i);
        json_object *print_files_obj;
        if (json_object_object_get_ex(task, "printFiles", &print_files_obj)) {
            max_files += json_object_array_length(print_files_obj);
        }
    }
    
    /* 分配内存存储文件 */
    *files = (PrintFileInfo *)malloc(sizeof(PrintFileInfo) * max_files);
    *count = 0;
    
    /* 解析每个任务 */
    for (int i = 0; i < array_len; i++) {
        json_object *task = json_object_array_get_idx(tasks_array, i);
        
        json_object *task_id_obj;
        json_object *print_files_obj;
        json_object *printer_obj;
        
        char printer_name[256] = "";
        
        if (json_object_object_get_ex(task, "printer", &printer_obj)) {
            json_object *printer_name_obj;
            if (json_object_object_get_ex(printer_obj, "name", &printer_name_obj)) {
                const char *pname = json_object_get_string(printer_name_obj);
                if (pname) {
                    strncpy_s(printer_name, sizeof(printer_name), pname, _TRUNCATE);
                }
            }
        }
        
        if (json_object_object_get_ex(task, "id", &task_id_obj) &&
            json_object_object_get_ex(task, "printFiles", &print_files_obj)) {
            
            const char *task_id_str = json_object_get_string(task_id_obj);
            char print_task_id[32];
            strncpy_s(print_task_id, sizeof(print_task_id), task_id_str ? task_id_str : "", _TRUNCATE);
            
            int file_count = json_object_array_length(print_files_obj);
            
            wchar_t wide_task_id[256];
            MultiByteToWideChar(CP_UTF8, 0, print_task_id, -1, wide_task_id, 256);
            
            wchar_t log[256];
            swprintf(log, 256, L"任务 %s 有 %d 个文件", wide_task_id, file_count);
            add_log(log);
            
            for (int j = 0; j < file_count; j++) {
                json_object *file = json_object_array_get_idx(print_files_obj, j);
                
                json_object *id_obj, *file_id_obj, *filename_obj;
                if (json_object_object_get_ex(file, "id", &id_obj) &&
                    json_object_object_get_ex(file, "fileId", &file_id_obj)) {
                    
                    (*files)[*count].id = json_object_get_int(id_obj);
                    
                    const char *file_id_str = json_object_get_string(file_id_obj);
                    snprintf((*files)[*count].print_task_id, sizeof((*files)[*count].print_task_id), "%s", print_task_id);
                    strncpy_s((*files)[*count].file_id, sizeof((*files)[*count].file_id), file_id_str ? file_id_str : "", _TRUNCATE);
                    strncpy_s((*files)[*count].printer_name, sizeof((*files)[*count].printer_name), printer_name, _TRUNCATE);
                    
                    if (json_object_object_get_ex(file, "filename", &filename_obj)) {
                        const char *fname = json_object_get_string(filename_obj);
                        if (fname) {
                            strncpy_s((*files)[*count].filename, sizeof((*files)[*count].filename), fname, _TRUNCATE);
                        } else {
                            strncpy_s((*files)[*count].filename, sizeof((*files)[*count].filename), file_id_str ? file_id_str : "unknown", _TRUNCATE);
                        }
                    } else {
                        strncpy_s((*files)[*count].filename, sizeof((*files)[*count].filename), file_id_str ? file_id_str : "unknown", _TRUNCATE);
                    }
                    
                    (*count)++;
                }
            }
        }
    }
    
    json_object_put(root);
    free(response);
    return 0;
}

/*
 * 报告文件打印成功
 * 通知服务器某个文件已打印完成
 * 使用POST请求，body格式: [id]
 */
int report_file_succeeded(HttpClient *client, int id) {
    /* 构建请求body，格式为JSON数组 */
    char json_body[256];
    snprintf(json_body, sizeof(json_body), "[%d]", id);
    
    char *response = NULL;
    long status_code = 0;
    
    /* 发送POST请求 */
    int ret = http_post_with_client_cookie(client, API_FILE_SUCCEED, json_body, &response, &status_code);
    
    if (ret == 0 && status_code == 200) {
        wchar_t log[256];
        swprintf(log, 256, L"文件 %d 已上报成功", id);
        add_log(log);
    } else {
        wchar_t log[256];
        swprintf(log, 256, L"上报文件状态失败 %d (状态码: %ld)", id, status_code);
        add_log(log);
    }
    
    if (response) free(response);
    
    return ret;
}
