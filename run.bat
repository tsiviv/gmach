@echo off

REM בדיקה אם node מותקן
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js לא מותקן. מבצע התקנה...
    start /wait msiexec /i "%~dp0node-install.msi" /quiet
    echo ממתין לסיום ההתקנה...
    timeout /t 5
) ELSE (
    echo Node.js כבר מותקן. ממשיך להריץ את הפרויקט...
)

REM הרצת הפרויקט
npm start

pause
