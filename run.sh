#!/usr/bin/env bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[+]${NC} $1"; }
warn()  { echo -e "${RED}[!]${NC} $1"; }
title() { echo -e "${CYAN}$1${NC}"; }

cd "$(dirname "$0")"

title "============================================"
title "  FranchiseOS — Linux/macOS Setup & Run"
title "============================================"
echo ""

# Check Python
PYTHON_BIN=""
if command -v python3.11 &>/dev/null; then
    PYTHON_BIN="python3.11"
elif command -v python3.12 &>/dev/null; then
    PYTHON_BIN="python3.12"
elif command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
else
    warn "python3 not found. Install Python 3 first."
    exit 1
fi
info "Python: $($PYTHON_BIN --version)"

# Check Node
if ! command -v node &>/dev/null; then
    warn "Node.js not found. Install from https://nodejs.org"
    exit 1
fi
info "Node:   $(node --version)"
echo ""

# Create virtualenv
if [ ! -d "venv" ]; then
    info "Creating Python virtual environment using $PYTHON_BIN..."
    "$PYTHON_BIN" -m venv venv
fi
source venv/bin/activate

# Install backend deps
info "Installing backend packages..."
pip install -q -r backend/requirements.txt
echo ""

# Run migrations
info "Running database migrations..."
cd backend
python3 manage.py migrate --run-syncdb
cd ..
echo ""

# Install frontend deps
info "Installing frontend packages..."
npm install
echo ""

# Kill anything on our ports
for p in 8001 5501; do
    pid=$(lsof -ti:$p 2>/dev/null) && kill -9 $pid 2>/dev/null || true
done
sleep 1

# Start backend
info "Starting Backend on http://localhost:8001..."
cd backend
python3 manage.py runserver 0.0.0.0:8001 &
BACKEND_PID=$!
cd ..

# Start frontend
info "Starting Frontend on http://localhost:5501..."
npm run dev -- --host 0.0.0.0 --port 5501 &
FRONTEND_PID=$!

sleep 3

title ""
title "============================================"
title "  FranchiseOS — Ready"
title "============================================"
title ""
title "  Frontend:  http://localhost:5501"
title "  Backend:   http://localhost:8001"
title ""
title "  Login:     shakeel / admin123 (admin)"
title ""
title "  Press Ctrl+C to stop both servers"
title "============================================"
echo ""

if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5501 2>/dev/null &
elif command -v open &>/dev/null; then
    open http://localhost:5501 2>/dev/null &
fi

cleanup() {
    echo ""
    info "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    info "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

wait
