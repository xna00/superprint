#ifndef PRINT_TASK_H
#define PRINT_TASK_H

#include <windows.h>
#include "http_client.h"

typedef struct _PrintFileInfo {
    char print_task_id[256];
    char file_id[256];
    char filename[256];
    char printer_name[256];
} PrintFileInfo;

int get_waiting_print_files(HttpClient *client, const char *computer_id, PrintFileInfo **files, int *count);
int report_file_succeeded(HttpClient *client, const char *file_id);

#endif
