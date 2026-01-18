@echo off
TITLE NUTS Explorer 2024 - Setup & Start
SETLOCAL

echo ======================================================
echo   NUTS Explorer 2024: Automatischer Startprozess
echo ======================================================

:: Prüfen ob Node.js installiert ist
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js wurde nicht gefunden. Bitte installieren Sie Node.js von https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Pruefe Abhaengigkeiten und installiere falls noetig...
call npm install

echo.
echo [2/3] Starte den Entwicklungsserver...
echo Das Fenster wird sich gleich minimieren, der Browser oeffnet sich automatisch.
echo.

:: Startet den Server in einem neuen Fenster und öffnet den Browser
start /min cmd /c "npm run dev"

:: Kurze Pause um dem Server Zeit zum Starten zu geben
timeout /t 5 /nobreak >nul

echo [3/3] Oeffne Browser...
start http://localhost:5173

echo.
echo ======================================================
echo   Fertig! Der Explorer sollte nun im Browser laufen.
echo   Schließen Sie dieses Fenster zum Beenden nicht sofort.
echo ======================================================
pause