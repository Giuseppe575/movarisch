@echo off
REM Script per build MOVARISCH Windows
REM Gestisce automaticamente il problema dei symbolic link

echo ========================================
echo  MOVARISCH - Build Installer Windows
echo ========================================
echo.

REM Controlla se siamo amministratori
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Eseguito come Amministratore
    echo.
    goto :build
) else (
    echo [!] NON eseguito come Amministratore
    echo.
    echo Hai due opzioni:
    echo.
    echo 1. Esegui questo script come Amministratore
    echo    ^(Tasto destro -^> Esegui come amministratore^)
    echo.
    echo 2. Abilita Developer Mode in Windows
    echo    ^(Impostazioni -^> Privacy -^> Per sviluppatori^)
    echo.
    choice /C 12 /M "Scegli opzione"

    if errorlevel 2 goto :devmode
    if errorlevel 1 goto :restart_admin
)

:restart_admin
echo.
echo Riavvio come Amministratore...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:devmode
echo.
echo Apro le Impostazioni Windows...
start ms-settings:developers
echo.
echo Dopo aver attivato Developer Mode:
echo 1. Riavvia il computer
echo 2. Esegui nuovamente questo script
echo.
pause
exit /b

:build
echo Avvio build con electron-builder...
echo.

call npm run build

if %errorLevel% == 0 (
    echo.
    echo ========================================
    echo  BUILD COMPLETATO CON SUCCESSO!
    echo ========================================
    echo.
    echo Installer creato in:
    echo %~dp0dist\MOVARISCH-Setup-1.1.0.exe
    echo.
    pause
) else (
    echo.
    echo ========================================
    echo  ERRORE DURANTE IL BUILD
    echo ========================================
    echo.
    echo Se il problema persiste:
    echo 1. Verifica di avere diritti di amministratore
    echo 2. Abilita Developer Mode
    echo 3. Contatta: atis.giuseppe@gmail.com
    echo.
    pause
    exit /b 1
)
