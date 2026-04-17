#define MyAppVersion "1.1.8"
#define MyAppPublisher "XNA"
#define MyAppName "超人打印"
#define MyAppURL "https://github.com/xna00/windevtest"
#define MyAppExeName "PrintDriver.exe"

[Setup]
AppId={{PrintDriver-2024-1.1.8}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=
InfoBeforeFile=
InfoAfterFile=
OutputDir=..\output
OutputBaseFilename=超人打印-Setup
SetupIconFile=
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest
MinVersion=6.0

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Messages]
chinesesimplified.BeveledLabel=超人打印
chinesesimplified.SetupAppTitle=安装
chinesesimplified.SetupWindowTitle=超人打印 - 安装向导

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式(&D)"; GroupDescription: "附加图标:"

[Files]
Source: "..\build\PrintDriver.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\cert\PrintDriver.cer"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\卸载 {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{userdesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "超人打印"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
Filename: "certutil.exe"; Parameters: "-addstore ""TrustedPublisher"" ""{tmp}\PrintDriver.cer"""; Flags: runhidden waituntilterminated; StatusMsg: "正在配置安全设置..."
Filename: "{app}\{#MyAppExeName}"; Description: "启动 {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function IsSilentInstall: Boolean;
begin
  Result := WizardSilent;
end;
