@echo off
REM Setup script for creating .env.local file

echo Creating .env.local file...
echo.

(
echo # ========================================
echo # Settlement Switch - Frontend Environment Variables
echo # ========================================
echo.
echo # ========================================
echo # WALLETCONNECT ^(OPTIONAL^)
echo # ========================================
echo # Get your project ID from: https://cloud.walletconnect.com
echo # If not set, a default placeholder will be used
echo # NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
) > .env.local

echo.
echo ✓ .env.local file created successfully!
echo.
echo To customize, edit: frontend\.env.local
echo.
pause

