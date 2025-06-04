@echo off
chcp 65001
SETLOCAL ENABLEEXTENSIONS

:: הדפסת הודעה במקום prompt
echo 🔐 הכנס סיסמה לקובץ הסביבה:
set /p ENV_PASS=

set "NODE_ENV_PASS=%ENV_PASS%"

echo 🚀 מריץ את השרת...
call npm run secure-start

echo 🔚 השרת נסגר. לחץ על מקש כלשהו לסיום...
pause > nul

ENDLOCAL
