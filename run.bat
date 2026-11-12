@echo off
REM FranchiseOS — Windows Setup & Run
cd /d "%~dp0"

echo ============================================
echo   FranchiseOS — Windows Setup ^& Run
echo ============================================
echo.

REM 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Python not found. Install Python 3 from https://python.org
    pause
    exit /b 1
)
python --version
echo.

REM 2. Check Node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
node --version
echo.

REM 3. Create virtualenv if not exists
if not exist "venv\" (
    echo [+] Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat

REM 4. Install backend deps
echo [+] Installing backend packages...
pip install -q -r backend\requirements.txt
echo.

REM 5. Run migrations & seed demo data
echo [+] Running database migrations...
cd /d "%~dp0backend"
call "..\venv\Scripts\python.exe" manage.py migrate --run-syncdb
echo [+] Seeding franchise catalogs and team logins...
call "..\venv\Scripts\python.exe" manage.py seed_data
cd /d "%~dp0"
echo.

REM 6. Install frontend deps
echo [+] Installing frontend packages...
call npm install
echo.

REM 7. Kill anything on our ports
for %%p in (8001 5501) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        taskkill /F /PID %%a >nul 2>nul
    )
)
timeout /t 1 /nobreak >nul

REM 8. Launch both servers
echo ============================================
echo   Starting servers...
echo ============================================
echo.

echo [+] Backend:  http://localhost:8001
start "FranchiseOS-Backend" cmd /k "cd /d ""%~dp0backend"" && ""%~dp0venv\Scripts\python.exe"" manage.py runserver 0.0.0.0:8001"

echo [+] Frontend: http://localhost:5501
start "FranchiseOS-Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev -- --host 0.0.0.0 --port 5501"

timeout /t 4 /nobreak >nul

echo.
echo ============================================
echo   FranchiseOS — Ready
echo ============================================
echo.
echo   Frontend:  http://localhost:5501
echo   Backend:   http://localhost:8001
echo.
echo   Team Logins:
echo     • shakeel  / admin123    (Corporate Admin)
echo     • vinay    / vinay123    (Domino's Owner)
echo     • mathan   / mathan123   (KFC Owner)
echo     • ramaguru / ramaguru123 (Street Arabiya Manager)
echo     • daniska  / daniska123  (Pothys Manager)
echo.
echo   Close the CMD windows to stop servers.
echo ============================================

start http://localhost:5501
pause
