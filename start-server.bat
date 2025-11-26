@echo off
REM ====================================================================
REM MOVARISCH - Script di avvio server locale
REM ====================================================================
REM Questo script avvia un server HTTP locale sulla porta 8080
REM per evitare problemi CORS con file:///
REM ====================================================================

echo.
echo ========================================
echo   MOVARISCH - Server Locale
echo ========================================
echo.
echo Avvio server HTTP sulla porta 8080...
echo.
echo Una volta avviato, apri il browser su:
echo   http://localhost:8080
echo.
echo Premi CTRL+C per fermare il server
echo ========================================
echo.

cd /d "%~dp0"

REM Verifica se Python e disponibile
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRORE: Python non trovato!
    echo.
    echo Installa Python da https://www.python.org/downloads/
    echo Assicurati di selezionare "Add Python to PATH" durante l'installazione
    echo.
    pause
    exit /b 1
)

REM Avvia server HTTP Python
python -m http.server 8080

pause
