#include <windows.h>
#include <commctrl.h>
#include <shlobj.h>
#include <shellapi.h>
#include <wininet.h>
#include <stdio.h>
#include <tlhelp32.h>
#include "version.h"

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "advapi32.lib")
#pragma comment(linker,"\"/manifestdependency:type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'\"")

#define ID_TIMER 1
#define ID_CLOSE_TIMER 2
#define WM_INSTALL_PROGRESS (WM_USER + 1)
#define WM_INSTALL_COMPLETE (WM_USER + 2)

static const WCHAR* APP_NAME = L"SuperPrint";
static const WCHAR* APP_DISPLAY_NAME = L"超人打印";
static const WCHAR* EXE_NAME = L"PrintDriver.exe";
static const WCHAR* TASK_NAME = L"SuperPrintUpdate";

#define WIDE2(x) L##x
#define WIDE(x) WIDE2(x)
static const WCHAR* APP_VERSION = WIDE(PROJECT_VERSION);

static const WCHAR* DOWNLOAD_URLS[] = {
    L"https://superprint6.xna00.top/PrintDriver.exe",
    L"https://superprint.xna00.top/PrintDriver.exe",
    NULL
};

static const WCHAR* API_CHECK_VERSION_URLS[] = {
    L"https://superprint6.xna00.top/api/version/check",
    L"https://superprint.xna00.top/api/version/check",
    NULL
};

static HWND hMainWnd, hLabelStatus, hProgress, hLabelDetail, hBtnClose;
static HFONT hFont;
static WCHAR InstallDir[MAX_PATH];
static WCHAR TempPath[MAX_PATH];
static WCHAR DownloadPath[MAX_PATH];
static WCHAR FinalExePath[MAX_PATH];
static HANDLE hThread = NULL;
static volatile BOOL g_cancelled = FALSE;
static int g_closeCountdown = 0;
static BOOL g_isUpdateMode = FALSE;

static BOOL KillProcessByName(LPCWSTR processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return FALSE;

    PROCESSENTRY32W pe32;
    pe32.dwSize = sizeof(pe32);

    BOOL found = FALSE;
    if (Process32FirstW(hSnapshot, &pe32)) {
        do {
            if (_wcsicmp(pe32.szExeFile, processName) == 0) {
                HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pe32.th32ProcessID);
                if (hProcess) {
                    TerminateProcess(hProcess, 0);
                    CloseHandle(hProcess);
                    found = TRUE;
                }
            }
        } while (Process32NextW(hSnapshot, &pe32));
    }

    CloseHandle(hSnapshot);
    return found;
}

static BOOL DeleteFileAndDirectory(LPCWSTR path) {
    WIN32_FIND_DATAW findData;
    WCHAR searchPath[MAX_PATH];
    swprintf_s(searchPath, MAX_PATH, L"%s\\*.*", path);

    HANDLE hFind = FindFirstFileW(searchPath, &findData);
    if (hFind == INVALID_HANDLE_VALUE) return FALSE;

    do {
        if (wcscmp(findData.cFileName, L".") == 0 || wcscmp(findData.cFileName, L"..") == 0)
            continue;

        WCHAR fullPath[MAX_PATH];
        swprintf_s(fullPath, MAX_PATH, L"%s\\%s", path, findData.cFileName);

        if (findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            DeleteFileAndDirectory(fullPath);
        } else {
            DeleteFileW(fullPath);
        }
    } while (FindNextFileW(hFind, &findData));

    FindClose(hFind);
    return RemoveDirectoryW(path);
}

static BOOL DownloadFileSingle(LPCWSTR url, LPCWSTR localPath) {
    HINTERNET hInternet = InternetOpenW(L"SuperPrint-Setup", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!hInternet) return FALSE;

    WCHAR urlWithTs[512];
    swprintf_s(urlWithTs, 512, L"%s?t=%lld", url, (long long)time(NULL));

    HINTERNET hUrl = InternetOpenUrlW(hInternet, urlWithTs, NULL, 0, INTERNET_FLAG_RELOAD, 0);
    if (!hUrl) {
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    DWORD contentLength = 0;
    DWORD bufLen = sizeof(contentLength);
    if (!HttpQueryInfoW(hUrl, HTTP_QUERY_CONTENT_LENGTH | HTTP_QUERY_FLAG_NUMBER, &contentLength, &bufLen, NULL)) {
        contentLength = 0;
    }

    HANDLE hFile = CreateFileW(localPath, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hFile == INVALID_HANDLE_VALUE) {
        InternetCloseHandle(hUrl);
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    char buffer[8192];
    DWORD bytesRead, bytesWritten;
    DWORD totalRead = 0;
    BOOL success = TRUE;

    while (!g_cancelled && InternetReadFile(hUrl, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        if (!WriteFile(hFile, buffer, bytesRead, &bytesWritten, NULL) || bytesWritten != bytesRead) {
            success = FALSE;
            break;
        }
        totalRead += bytesRead;
        if (contentLength > 0) {
            PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 20 + (totalRead * 40) / contentLength, 0);
        }
    }

    CloseHandle(hFile);
    InternetCloseHandle(hUrl);
    InternetCloseHandle(hInternet);

    if (!success || (contentLength > 0 && totalRead != contentLength)) {
        DeleteFileW(localPath);
        return FALSE;
    }

    return TRUE;
}

static BOOL DownloadFile(const WCHAR** urls, LPCWSTR localPath) {
    for (int i = 0; urls[i] != NULL; i++) {
        if (DownloadFileSingle(urls[i], localPath)) {
            return TRUE;
        }
        DeleteFileW(localPath);
    }
    return FALSE;
}

static BOOL DownloadFileSilentSingle(LPCWSTR url, LPCWSTR localPath) {
    HINTERNET hInternet = InternetOpenW(L"SuperPrint-Setup", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!hInternet) return FALSE;

    WCHAR urlWithTs[512];
    swprintf_s(urlWithTs, 512, L"%s?t=%lld", url, (long long)time(NULL));

    HINTERNET hUrl = InternetOpenUrlW(hInternet, urlWithTs, NULL, 0, INTERNET_FLAG_RELOAD, 0);
    if (!hUrl) {
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    HANDLE hFile = CreateFileW(localPath, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hFile == INVALID_HANDLE_VALUE) {
        InternetCloseHandle(hUrl);
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    char buffer[8192];
    DWORD bytesRead, bytesWritten;
    BOOL success = TRUE;

    while (InternetReadFile(hUrl, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        if (!WriteFile(hFile, buffer, bytesRead, &bytesWritten, NULL) || bytesWritten != bytesRead) {
            success = FALSE;
            break;
        }
    }

    CloseHandle(hFile);
    InternetCloseHandle(hUrl);
    InternetCloseHandle(hInternet);

    if (!success) {
        DeleteFileW(localPath);
        return FALSE;
    }

    return TRUE;
}

static BOOL DownloadFileSilent(const WCHAR** urls, LPCWSTR localPath) {
    for (int i = 0; urls[i] != NULL; i++) {
        if (DownloadFileSilentSingle(urls[i], localPath)) {
            return TRUE;
        }
        DeleteFileW(localPath);
    }
    return FALSE;
}

static BOOL HttpPostJsonSingle(LPCWSTR url, LPCSTR jsonBody, char* response, DWORD responseSize) {
    HINTERNET hInternet = InternetOpenW(L"SuperPrint-Setup", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!hInternet) return FALSE;

    URL_COMPONENTSW uc = {0};
    uc.dwStructSize = sizeof(uc);
    WCHAR hostName[256] = {0};
    WCHAR urlPath[512] = {0};
    uc.lpszHostName = hostName;
    uc.dwHostNameLength = 256;
    uc.lpszUrlPath = urlPath;
    uc.dwUrlPathLength = 512;
    InternetCrackUrlW(url, 0, 0, &uc);

    HINTERNET hConnect = InternetConnectW(hInternet, hostName, uc.nPort, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    DWORD flags = (uc.nScheme == INTERNET_SCHEME_HTTPS) ? INTERNET_FLAG_SECURE : 0;
    HINTERNET hRequest = HttpOpenRequestW(hConnect, L"POST", urlPath, NULL, NULL, NULL, flags, 0);
    if (!hRequest) {
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return FALSE;
    }

    LPCSTR headers = "Content-Type: application/json\r\n";
    BOOL success = HttpSendRequestA(hRequest, headers, (DWORD)strlen(headers), (LPVOID)jsonBody, (DWORD)strlen(jsonBody));
    
    if (success) {
        DWORD bytesRead = 0;
        DWORD totalRead = 0;
        char buffer[4096];
        response[0] = '\0';
        
        while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
            if (totalRead + bytesRead >= responseSize - 1) break;
            memcpy(response + totalRead, buffer, bytesRead);
            totalRead += bytesRead;
        }
        response[totalRead] = '\0';
    }

    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
    return success;
}

static BOOL HttpPostJson(const WCHAR** urls, LPCSTR jsonBody, char* response, DWORD responseSize) {
    for (int i = 0; urls[i] != NULL; i++) {
        if (HttpPostJsonSingle(urls[i], jsonBody, response, responseSize)) {
            return TRUE;
        }
    }
    return FALSE;
}

static BOOL ExtractJsonString(LPCSTR json, LPCSTR key, char* value, DWORD valueSize) {
    char searchKey[128];
    sprintf_s(searchKey, sizeof(searchKey), "\"%s\":\"", key);
    
    LPCSTR pos = strstr(json, searchKey);
    if (!pos) {
        sprintf_s(searchKey, sizeof(searchKey), "\"%s\": \"", key);
        pos = strstr(json, searchKey);
    }
    if (!pos) return FALSE;
    
    pos += strlen(searchKey);
    LPCSTR end = strchr(pos, '"');
    if (!end) return FALSE;
    
    DWORD len = (DWORD)(end - pos);
    if (len >= valueSize) len = valueSize - 1;
    memcpy(value, pos, len);
    value[len] = '\0';
    return TRUE;
}

static int ExtractJsonUrlArray(LPCSTR json, LPCSTR key, WCHAR urls[][512], int maxUrls) {
    char searchKey[128];
    sprintf_s(searchKey, sizeof(searchKey), "\"%s\":[", key);
    
    LPCSTR pos = strstr(json, searchKey);
    if (!pos) {
        sprintf_s(searchKey, sizeof(searchKey), "\"%s\": [", key);
        pos = strstr(json, searchKey);
    }
    if (!pos) return 0;
    
    pos += strlen(searchKey);
    
    int count = 0;
    while (count < maxUrls) {
        while (*pos == ' ' || *pos == '\n' || *pos == '\r' || *pos == ',') pos++;
        
        if (*pos == ']') break;
        
        LPCSTR urlStart = strchr(pos, '"');
        if (!urlStart) break;
        urlStart++;
        
        LPCSTR urlEnd = strchr(urlStart, '"');
        if (!urlEnd) break;
        
        DWORD len = (DWORD)(urlEnd - urlStart);
        if (len >= 512) len = 511;
        
        char urlA[512];
        memcpy(urlA, urlStart, len);
        urlA[len] = '\0';
        
        MultiByteToWideChar(CP_UTF8, 0, urlA, -1, urls[count], 512);
        count++;
        
        pos = urlEnd + 1;
    }
    
    return count;
}

static BOOL CreateShortcutWithArgs(LPCWSTR targetPath, LPCWSTR args, LPCWSTR shortcutPath) {
    HRESULT hr = CoInitialize(NULL);
    if (FAILED(hr)) return FALSE;

    IShellLinkW* pShellLink = NULL;
    IPersistFile* pPersistFile = NULL;
    BOOL result = FALSE;

    hr = CoCreateInstance(&CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, &IID_IShellLinkW, (void**)&pShellLink);
    if (SUCCEEDED(hr)) {
        pShellLink->lpVtbl->SetPath(pShellLink, targetPath);
        if (args) {
            pShellLink->lpVtbl->SetArguments(pShellLink, args);
        }

        hr = pShellLink->lpVtbl->QueryInterface(pShellLink, &IID_IPersistFile, (void**)&pPersistFile);
        if (SUCCEEDED(hr)) {
            hr = pPersistFile->lpVtbl->Save(pPersistFile, shortcutPath, TRUE);
            result = SUCCEEDED(hr);
            pPersistFile->lpVtbl->Release(pPersistFile);
        }
        pShellLink->lpVtbl->Release(pShellLink);
    }

    CoUninitialize();
    return result;
}

static BOOL CreateShortcut(LPCWSTR targetPath, LPCWSTR shortcutPath) {
    return CreateShortcutWithArgs(targetPath, NULL, shortcutPath);
}

static void CreateUpdateTask(void) {
    WCHAR setupPath[MAX_PATH];
    swprintf_s(setupPath, MAX_PATH, L"%s\\Setup.exe", InstallDir);

    WCHAR cmd[1024];
    swprintf_s(cmd, sizeof(cmd)/sizeof(WCHAR),
        L"schtasks /create /tn \"%s\" /tr \"\\\"%s\\\" /update\" /sc hourly /f",
        TASK_NAME, setupPath);

    STARTUPINFOW si = { sizeof(si) };
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    PROCESS_INFORMATION pi;

    if (CreateProcessW(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        WaitForSingleObject(pi.hProcess, 5000);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
}

static void DeleteUpdateTask(void) {
    WCHAR cmd[256];
    swprintf_s(cmd, sizeof(cmd)/sizeof(WCHAR), L"schtasks /delete /tn \"%s\" /f", TASK_NAME);

    STARTUPINFOW si = { sizeof(si) };
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    PROCESS_INFORMATION pi;

    if (CreateProcessW(NULL, cmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        WaitForSingleObject(pi.hProcess, 5000);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    }
}

static void DoSilentUpdate(void) {
    WCHAR installDir[MAX_PATH];
    GetEnvironmentVariableW(L"LOCALAPPDATA", installDir, MAX_PATH);
    wcscat_s(installDir, MAX_PATH, L"\\");
    wcscat_s(installDir, MAX_PATH, APP_NAME);

    WCHAR exePath[MAX_PATH];
    swprintf_s(exePath, MAX_PATH, L"%s\\%s", installDir, EXE_NAME);

    if (GetFileAttributesW(exePath) == INVALID_FILE_ATTRIBUTES) {
        return;
    }

    char jsonBody[64];
    sprintf_s(jsonBody, sizeof(jsonBody), "[\"%S\"]", APP_VERSION);

    char response[4096] = {0};
    if (!HttpPostJson(API_CHECK_VERSION_URLS, jsonBody, response, sizeof(response))) {
        return;
    }

    WCHAR downloadUrls[10][512];
    int urlCount = ExtractJsonUrlArray(response, "downloadUrls", downloadUrls, 10);
    if (urlCount == 0) {
        return;
    }

    WCHAR tempPath[MAX_PATH];
    GetTempPathW(MAX_PATH, tempPath);
    wcscat_s(tempPath, MAX_PATH, L"SuperPrint-Update\\");
    CreateDirectoryW(tempPath, NULL);

    WCHAR downloadPath[MAX_PATH];
    swprintf_s(downloadPath, MAX_PATH, L"%sSetup.exe", tempPath);

    const WCHAR* urlPtrs[11];
    for (int i = 0; i < urlCount && i < 10; i++) {
        urlPtrs[i] = downloadUrls[i];
    }
    urlPtrs[urlCount] = NULL;

    if (DownloadFileSilent(urlPtrs, downloadPath)) {
        ShellExecuteW(NULL, L"open", downloadPath, NULL, NULL, SW_SHOW);
    }
}

static void DoInstall(void) {
    swprintf_s(FinalExePath, MAX_PATH, L"%s\\%s", InstallDir, EXE_NAME);

    PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 70, (LPARAM)L"[3/5] 安装文件...");

    if (GetFileAttributesW(FinalExePath) != INVALID_FILE_ATTRIBUTES) {
        PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 72, (LPARAM)L"关闭正在运行的程序...");
        KillProcessByName(EXE_NAME);
        Sleep(500);
    }

    CreateDirectoryW(InstallDir, NULL);
    if (!CopyFileW(DownloadPath, FinalExePath, FALSE)) {
        PostMessage(hMainWnd, WM_INSTALL_COMPLETE, 0, (LPARAM)L"无法复制文件");
        return;
    }

    WCHAR selfPath[MAX_PATH];
    GetModuleFileNameW(NULL, selfPath, MAX_PATH);
    WCHAR setupPath[MAX_PATH];
    swprintf_s(setupPath, MAX_PATH, L"%s\\Setup.exe", InstallDir);
    CopyFileW(selfPath, setupPath, FALSE);

    PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 85, (LPARAM)L"[4/5] 创建快捷方式...");

    WCHAR appData[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", appData, MAX_PATH);

    WCHAR startMenuFolder[MAX_PATH];
    swprintf_s(startMenuFolder, MAX_PATH, L"%s\\Microsoft\\Windows\\Start Menu\\Programs\\%s", appData, APP_DISPLAY_NAME);
    CreateDirectoryW(startMenuFolder, NULL);

    WCHAR appShortcut[MAX_PATH];
    swprintf_s(appShortcut, MAX_PATH, L"%s\\%s.lnk", startMenuFolder, APP_DISPLAY_NAME);
    CreateShortcut(FinalExePath, appShortcut);

    WCHAR uninstallShortcut[MAX_PATH];
    swprintf_s(uninstallShortcut, MAX_PATH, L"%s\\卸载.lnk", startMenuFolder);
    CreateShortcutWithArgs(setupPath, L"/uninstall", uninstallShortcut);

    WCHAR desktopShortcut[MAX_PATH];
    WCHAR userProfile[MAX_PATH];
    GetEnvironmentVariableW(L"USERPROFILE", userProfile, MAX_PATH);
    swprintf_s(desktopShortcut, MAX_PATH, L"%s\\Desktop\\%s.lnk", userProfile, APP_DISPLAY_NAME);
    CreateShortcut(FinalExePath, desktopShortcut);

    HKEY hKey;
    if (RegOpenKeyExW(HKEY_CURRENT_USER, L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_WRITE, &hKey) == ERROR_SUCCESS) {
        WCHAR quotedPath[MAX_PATH + 2];
        swprintf_s(quotedPath, sizeof(quotedPath)/sizeof(WCHAR), L"\"%s\"", FinalExePath);
        RegSetValueExW(hKey, APP_NAME, 0, REG_SZ, (const BYTE*)quotedPath, (DWORD)(wcslen(quotedPath)+1)*sizeof(WCHAR));
        RegCloseKey(hKey);
    }

    CreateUpdateTask();

    PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 95, (LPARAM)L"[5/5] 清理临时文件...");
    DeleteFileW(DownloadPath);
    RemoveDirectoryW(TempPath);

    PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 100, 0);
    PostMessage(hMainWnd, WM_INSTALL_COMPLETE, 1, 0);
}

static DWORD WINAPI InstallThread(LPVOID param) {
    PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 10, (LPARAM)L"[1/5] 检查已安装版本...");

    GetEnvironmentVariableW(L"LOCALAPPDATA", InstallDir, MAX_PATH);
    wcscat_s(InstallDir, MAX_PATH, L"\\");
    wcscat_s(InstallDir, MAX_PATH, APP_NAME);

    WCHAR existingExe[MAX_PATH];
    swprintf_s(existingExe, MAX_PATH, L"%s\\%s", InstallDir, EXE_NAME);
    if (GetFileAttributesW(existingExe) != INVALID_FILE_ATTRIBUTES) {
        WCHAR msg[128];
        swprintf_s(msg, sizeof(msg)/sizeof(WCHAR), L"发现已安装版本，将更新到 %s", APP_VERSION);
        PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 15, (LPARAM)msg);
    }

    PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 20, (LPARAM)L"[2/5] 下载 PrintDriver.exe ...");

    GetTempPathW(MAX_PATH, TempPath);
    wcscat_s(TempPath, MAX_PATH, L"SuperPrint-Setup\\");
    CreateDirectoryW(TempPath, NULL);

    wcscat_s(DownloadPath, MAX_PATH, TempPath);
    wcscat_s(DownloadPath, MAX_PATH, EXE_NAME);

    if (DownloadFile(DOWNLOAD_URLS, DownloadPath)) {
        PostMessage(hMainWnd, WM_INSTALL_PROGRESS, 60, (LPARAM)L"下载完成");
        DoInstall();
    } else {
        PostMessage(hMainWnd, WM_INSTALL_COMPLETE, 0, (LPARAM)L"下载文件失败，请检查网络连接");
    }

    return 0;
}

static void DoUninstall(void) {
    if (MessageBoxW(NULL, L"确定要卸载 超人打印 吗？", L"卸载确认", MB_YESNO | MB_ICONQUESTION) != IDYES) {
        return;
    }

    WCHAR installDir[MAX_PATH];
    GetEnvironmentVariableW(L"LOCALAPPDATA", installDir, MAX_PATH);
    wcscat_s(installDir, MAX_PATH, L"\\");
    wcscat_s(installDir, MAX_PATH, APP_NAME);

    if (GetFileAttributesW(installDir) == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(NULL, L"未找到安装目录", L"卸载 超人打印", MB_OK | MB_ICONERROR);
        return;
    }

    KillProcessByName(EXE_NAME);
    Sleep(500);

    WCHAR appData[MAX_PATH];
    GetEnvironmentVariableW(L"APPDATA", appData, MAX_PATH);

    WCHAR startMenuFolder[MAX_PATH];
    swprintf_s(startMenuFolder, MAX_PATH, L"%s\\Microsoft\\Windows\\Start Menu\\Programs\\%s", appData, APP_DISPLAY_NAME);

    WCHAR shortcutPath[MAX_PATH];
    swprintf_s(shortcutPath, MAX_PATH, L"%s\\%s.lnk", startMenuFolder, APP_DISPLAY_NAME);
    DeleteFileW(shortcutPath);

    swprintf_s(shortcutPath, MAX_PATH, L"%s\\卸载.lnk", startMenuFolder);
    DeleteFileW(shortcutPath);

    RemoveDirectoryW(startMenuFolder);

    WCHAR userProfile[MAX_PATH];
    GetEnvironmentVariableW(L"USERPROFILE", userProfile, MAX_PATH);
    swprintf_s(shortcutPath, MAX_PATH, L"%s\\Desktop\\%s.lnk", userProfile, APP_DISPLAY_NAME);
    DeleteFileW(shortcutPath);

    HKEY hKey;
    if (RegOpenKeyExW(HKEY_CURRENT_USER, L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", 0, KEY_WRITE, &hKey) == ERROR_SUCCESS) {
        RegDeleteValueW(hKey, APP_NAME);
        RegCloseKey(hKey);
    }

    DeleteUpdateTask();

    WCHAR tempBat[MAX_PATH];
    GetTempPathW(MAX_PATH, tempBat);
    wcscat_s(tempBat, MAX_PATH, L"uninstall_superprint.bat");

    HANDLE hBat = CreateFileW(tempBat, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hBat != INVALID_HANDLE_VALUE) {
        char batContent[1024];
        int len = sprintf_s(batContent, sizeof(batContent),
            "@echo off\r\n"
            ":retry\r\n"
            "rd /s /q \"%S\" 2>nul\r\n"
            "if exist \"%S\" (\r\n"
            "    timeout /t 1 /nobreak >nul\r\n"
            "    goto retry\r\n"
            ")\r\n"
            "del /f /q \"%S\"\r\n",
            installDir, installDir, tempBat);
        DWORD written;
        WriteFile(hBat, batContent, len, &written, NULL);
        CloseHandle(hBat);

        ShellExecuteW(NULL, L"open", tempBat, NULL, NULL, SW_HIDE);
    }

    MessageBoxW(NULL, L"卸载完成！", L"卸载 超人打印", MB_OK | MB_ICONINFORMATION);
}

static LRESULT CALLBACK WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE: {
            hFont = CreateFontW(18, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
                DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Microsoft YaHei");

            hLabelStatus = CreateWindowExW(0, L"Static", L"准备安装...",
                WS_VISIBLE | WS_CHILD | SS_CENTER,
                20, 30, 420, 30, hWnd, NULL, NULL, NULL);
            SendMessage(hLabelStatus, WM_SETFONT, (WPARAM)hFont, TRUE);

            hProgress = CreateWindowExW(0, PROGRESS_CLASSW, NULL,
                WS_VISIBLE | WS_CHILD | PBS_SMOOTH,
                20, 70, 420, 30, hWnd, NULL, NULL, NULL);
            SendMessage(hProgress, PBM_SETRANGE, 0, MAKELPARAM(0, 100));

            hLabelDetail = CreateWindowExW(0, L"Static", L"",
                WS_VISIBLE | WS_CHILD | SS_CENTER,
                20, 120, 420, 25, hWnd, NULL, NULL, NULL);
            SendMessage(hLabelDetail, WM_SETFONT, (WPARAM)hFont, TRUE);

            hBtnClose = CreateWindowExW(0, L"Button", L"关闭",
                WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON | WS_DISABLED,
                180, 170, 100, 35, hWnd, (HMENU)1, NULL, NULL);
            SendMessage(hBtnClose, WM_SETFONT, (WPARAM)hFont, TRUE);

            SetTimer(hWnd, ID_TIMER, 500, NULL);
            break;
        }

        case WM_TIMER: {
            if (wParam == ID_TIMER) {
                KillTimer(hWnd, ID_TIMER);
                DWORD threadId;
                hThread = CreateThread(NULL, 0, InstallThread, NULL, 0, &threadId);
            }
            else if (wParam == ID_CLOSE_TIMER) {
                g_closeCountdown--;
                if (g_closeCountdown <= 0) {
                    KillTimer(hWnd, ID_CLOSE_TIMER);
                    PostQuitMessage(0);
                } else {
                    WCHAR buf[64];
                    swprintf_s(buf, sizeof(buf)/sizeof(WCHAR), L"%d 秒后自动关闭", g_closeCountdown);
                    SetWindowTextW(hLabelDetail, buf);
                }
            }
            break;
        }

        case WM_INSTALL_PROGRESS: {
            SendMessage(hProgress, PBM_SETPOS, (int)wParam, 0);
            if (lParam) {
                SetWindowTextW(hLabelStatus, (LPCWSTR)lParam);
            }
            break;
        }

        case WM_INSTALL_COMPLETE: {
            if (wParam == 1) {
                SetWindowTextW(hLabelStatus, L"安装完成!");
                if (!g_isUpdateMode) {
                    SetWindowTextW(hLabelDetail, L"正在启动 超人打印 ...");
                    ShellExecuteW(NULL, L"open", FinalExePath, NULL, InstallDir, SW_SHOW);
                }
                g_closeCountdown = 5;
                SetTimer(hWnd, ID_CLOSE_TIMER, 1000, NULL);
            } else {
                SetWindowTextW(hLabelStatus, L"安装失败");
                SetWindowTextW(hLabelDetail, (LPCWSTR)lParam);
                EnableWindow(hBtnClose, TRUE);
            }
            break;
        }

        case WM_COMMAND: {
            if (LOWORD(wParam) == 1) {
                PostQuitMessage(0);
            }
            break;
        }

        case WM_DESTROY: {
            g_cancelled = TRUE;
            if (hThread) {
                WaitForSingleObject(hThread, 1000);
                CloseHandle(hThread);
            }
            DeleteObject(hFont);
            PostQuitMessage(0);
            break;
        }
    }
    return DefWindowProcW(hWnd, msg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    int argc;
    LPWSTR* argv = CommandLineToArgvW(GetCommandLineW(), &argc);
    if (argv) {
        for (int i = 1; i < argc; i++) {
            if (wcscmp(argv[i], L"/uninstall") == 0) {
                LocalFree(argv);
                DoUninstall();
                return 0;
            }
            if (wcscmp(argv[i], L"/update") == 0) {
                LocalFree(argv);
                DoSilentUpdate();
                return 0;
            }
        }
        LocalFree(argv);
    }

    INITCOMMONCONTROLSEX icc = { sizeof(icc), ICC_STANDARD_CLASSES };
    InitCommonControlsEx(&icc);

    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(wc);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_BTNFACE + 1);
    wc.lpszClassName = L"SuperPrintSetupClass";
    wc.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
    RegisterClassExW(&wc);

    WCHAR title[64];
    swprintf_s(title, sizeof(title)/sizeof(WCHAR), L"%s %s 安装程序", APP_DISPLAY_NAME, APP_VERSION);

    hMainWnd = CreateWindowExW(0, L"SuperPrintSetupClass", title,
        WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_MINIMIZEBOX,
        CW_USEDEFAULT, CW_USEDEFAULT, 480, 280, NULL, NULL, hInstance, NULL);

    ShowWindow(hMainWnd, nCmdShow);
    UpdateWindow(hMainWnd);

    MSG msg;
    while (GetMessageW(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    return (int)msg.wParam;
}
