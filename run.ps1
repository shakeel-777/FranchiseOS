# FranchiseOS — Windows PowerShell Setup & Run
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FranchiseOS — Windows (PowerShell)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check prerequisites
try { $null = Get-Command python; Write-Host "[+] Python: $(python --version)" -ForegroundColor Green }
catch { Write-Host "[!] Python 3 required — https://python.org" -ForegroundColor Red; exit 1 }

try { $null = Get-Command node; Write-Host "[+] Node:   $(node --version)" -ForegroundColor Green }
catch { Write-Host "[!] Node.js required — https://nodejs.org" -ForegroundColor Red; exit 1 }
Write-Host ""

# 2. Create & activate virtualenv
if (-not (Test-Path "venv")) {
    Write-Host "[+] Creating Python virtual environment..." -ForegroundColor Green
    python -m venv venv
}
& .\venv\Scripts\Activate.ps1

# 3. Install backend deps
Write-Host "[+] Installing backend Python packages..." -ForegroundColor Green
pip install -q -r backend\requirements.txt
Write-Host ""

# 4. Migrate
Write-Host "[+] Running database migrations..." -ForegroundColor Green
Set-Location backend
python manage.py migrate --run-syncdb
Set-Location ..
Write-Host ""

# 5. Install frontend deps
Write-Host "[+] Installing frontend packages..." -ForegroundColor Green
npm install
Write-Host ""

# 6. Free ports
Write-Host "[+] Clearing ports 8001, 5501..." -ForegroundColor Green
foreach ($port in @(8001, 5501)) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep 1

# 7. Launch servers in separate windows
Write-Host "[+] Backend  -> http://localhost:8001" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; ..\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8001"

Write-Host "[+] Frontend -> http://localhost:5501" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev -- --host 0.0.0.0 --port 5501"

Start-Sleep 4

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FranchiseOS — Ready" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:  http://localhost:5501"
Write-Host "  Backend:   http://localhost:8001"
Write-Host ""
Write-Host "  Login:     shakeel / admin123 (admin)"
Write-Host ""
Write-Host "  Close the PowerShell windows to stop."
Write-Host "============================================" -ForegroundColor Cyan

Start-Process http://localhost:5501
