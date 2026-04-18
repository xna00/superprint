@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat"
cd c:\Users\xna\source\repos\superprint\printdriver\src
cl /MT /utf-8 /Fe:..\build\Setup.exe setup.c comctl32.lib wininet.lib shell32.lib ole32.lib user32.lib gdi32.lib advapi32.lib
