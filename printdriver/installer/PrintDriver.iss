#define MyAppVersion "1.1.8"
#define MyAppPublisher "XNA"
#define MyAppName "SuperPrint"
#define MyAppDisplayName "超人打印"
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
DefaultGroupName={#MyAppDisplayName}
AllowNoIcons=yes
LicenseFile=
InfoBeforeFile=
InfoAfterFile=
OutputDir=..\output
OutputBaseFilename=SuperPrint-Setup
SetupIconFile=
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest
MinVersion=6.0

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"

[Files]
Source: "..\build\PrintDriver.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\cert\PrintDriver.cer"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\{#MyAppDisplayName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Uninstall {#MyAppDisplayName}"; Filename: "{uninstallexe}"
Name: "{userdesktop}\{#MyAppDisplayName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "SuperPrint"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
Filename: "certutil.exe"; Parameters: "-addstore ""TrustedPublisher"" ""{tmp}\PrintDriver.cer"""; Flags: runhidden waituntilterminated; StatusMsg: "Configuring security settings..."
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppDisplayName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
function IsSilentInstall: Boolean;
begin
  Result := WizardSilent;
end;
