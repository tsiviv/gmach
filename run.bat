@echo off
chcp 65001
SETLOCAL ENABLEEXTENSIONS

:: הוספת nodejs מקומית ל-PATH
set "NODEJS_DIR=%~dp0nodejs"
set "PATH=%NODEJS_DIR%;%NODEJS_DIR%\node_modules\npm\bin;%PATH%"

:: הדפסת הודעה במקום prompt
echo 🔐 הביבסה ץבוקל המסיס סנכה
set /p ENV_PASS=

set "NODE_ENV_PASS=%ENV_PASS%"

:: התקנת jsonwebtoken
echo 📦 jsonwebtoken תקלדה...
call npm install jsonwebtoken

echo 🚀 תרשה תא ץירמ...
call npm run secure-start

echo 🔚 םויסל והשלכ לע ץחל .רגסנ תרשה...
pause > nul

ENDLOCAL
