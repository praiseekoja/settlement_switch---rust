@echo off
echo Setting up Settlement Switch project...

REM Start from the project root
cd /d "%~dp0"

REM Setup Stylus contract
echo Setting up Stylus contract...
cd stylus
cargo stylus check
if errorlevel 1 goto error

cargo stylus build
if errorlevel 1 goto error

REM Run tests
echo Running contract tests...
cargo test
if errorlevel 1 goto error

REM Start local node in background
start cmd /c cargo stylus server

REM Wait for node to start
timeout /t 5

REM Deploy to local node
echo Deploying contract to local node...
cargo stylus deploy
if errorlevel 1 goto error

REM Setup frontend
echo Setting up frontend...
cd ../frontend
call npm install
if errorlevel 1 goto error

REM Start frontend development server
echo Starting frontend development server...
call npm run dev
if errorlevel 1 goto error

goto :eof

:error
echo Error occurred! See above for details.
exit /b 1