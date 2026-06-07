#!/bin/bash
set -e

echo ""
echo "  ███╗   ██╗ █████╗ ██████╗ ██╗██████╗ ███╗   ██╗███████╗████████╗"
echo "  ████╗  ██║██╔══██╗██╔══██╗██║██╔══██╗████╗  ██║██╔════╝╚══██╔══╝"
echo "  ██╔██╗ ██║███████║██║  ██║██║██████╔╝██╔██╗ ██║█████╗     ██║   "
echo "  ██║╚██╗██║██╔══██║██║  ██║██║██╔══██╗██║╚██╗██║██╔══╝     ██║   "
echo "  ██║ ╚████║██║  ██║██████╔╝██║██║  ██║██║ ╚████║███████╗   ██║   "
echo "  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   "
echo ""
echo "  Disaster Intelligence Platform v2 — Explainable AI · Offline-First"
echo ""

# Check dependencies
echo "Checking dependencies..."

if ! command -v python3 &>/dev/null; then
  echo "ERROR: Python 3 not found. Install Python 3.10+"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node.js 18+"
  exit 1
fi

if command -v ollama &>/dev/null; then
  echo "✓ Ollama found"
  if ! ollama list | grep -q "gemma"; then
    echo "  Pulling gemma3:4b (lightweight, edge-optimized)..."
    ollama pull gemma3:4b
  fi
else
  echo "⚠  Ollama not found — running in demo mode"
  echo "   Install: curl -fsSL https://ollama.ai/install.sh | sh"
fi

# Install Python deps
echo ""
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Install Node deps
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

# Start both servers
echo ""
echo "Starting NadirNet..."
echo ""

# Start backend in background
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NadirNet running:"
echo "  Frontend  →  http://localhost:5173"
echo "  Backend   →  http://localhost:8000"
echo "  API Docs  →  http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait
