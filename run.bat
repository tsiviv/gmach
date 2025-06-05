@echo off
chcp 65001
SETLOCAL ENABLEEXTENSIONS

:: הדפסת הודעה במקום prompt
echo 🔐 הביבסה ץבוקל המסיס סנכה
set /p ENV_PASS=

set "NODE_ENV_PASS=%ENV_PASS%"

echo 🚀 תרשה תא ץירמ...
call npm run secure-start

echo 🔚 םויסל והשלכ לע ץחל .רגסנ תרשה...
pause > nul

ENDLOCAL
