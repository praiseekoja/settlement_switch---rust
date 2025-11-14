@echo off
echo.
echo ========================================
echo   Initializing Settlement Switch Contract
echo ========================================
echo.
echo Contract: 0x443ec868aafd6eba80d124a8cb4345cc827e7ee1
echo.
echo Step 1: Initialize contract
echo.
"C:\Program Files\nodejs\node.exe" frontend\init-only.js
echo.
echo.
echo Step 2: Add bridge adapters
echo.
"C:\Program Files\nodejs\node.exe" frontend\add-adapters.js
echo.
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Now refresh your frontend at localhost:3000
echo.
pause


