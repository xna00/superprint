@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat"


echo Building...
cmake -B build -G "Visual Studio 18 2026" -A x64  -DVCPKG_TARGET_TRIPLET=x64-windows-static -DVCPKG_INSTALLED_DIR="%CD%\vcpkg_installed"
cmake --build build --config Release
