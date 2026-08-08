#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# AgroKart Full Stack Startup Script
# Starts: RAG Service (8000) → Express Backend (4000) → React Frontend (3000)
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${GREEN}${BOLD}🌾 AgroKart Full Stack Startup${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── Kill old processes ─────────────────────────────────────────────────────────
echo -e "${YELLOW}⟳ Stopping existing services...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:4000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1

# ── 1. Start RAG Service (Python FastAPI) ─────────────────────────────────────
echo -e "${BLUE}[1/3] Starting Kisan Mitra RAG Service on port 8000...${NC}"
if [ -d "$SCRIPT_DIR/rag_service/venv" ]; then
  (
    cd "$SCRIPT_DIR/rag_service" && \
    source venv/bin/activate && \
    python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8000 \
      > /tmp/agrokart-rag.log 2>&1 &
  )
  RAG_PID=$!
  sleep 3
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ RAG Service running on http://localhost:8000${NC}"
  else
    echo -e "${RED}  ✗ RAG Service failed to start (check /tmp/agrokart-rag.log)${NC}"
  fi
else
  echo -e "${RED}  ✗ RAG venv not found. Run: cd rag_service && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
fi

# ── 2. Start Express Backend ───────────────────────────────────────────────────
echo -e "${BLUE}[2/3] Starting Express Backend on port 4000...${NC}"
if [ -d "$SCRIPT_DIR/server/node_modules" ]; then
  (
    cd "$SCRIPT_DIR/server" && \
    PORT=4000 node index.js > /tmp/agrokart-server.log 2>&1 &
  )
  sleep 3
  if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Express Backend running on http://localhost:4000${NC}"
  else
    echo -e "${YELLOW}  ⚠ Express started (MongoDB may not be connected — chat still works)${NC}"
  fi
else
  echo -e "${RED}  ✗ server/node_modules missing. Run: cd server && npm install${NC}"
fi

# ── 3. Start React Frontend ────────────────────────────────────────────────────
echo -e "${BLUE}[3/3] Starting React Frontend on port 3000...${NC}"
if [ -d "$SCRIPT_DIR/client/node_modules" ]; then
  (
    cd "$SCRIPT_DIR/client" && \
    PORT=3000 BROWSER=none npm start > /tmp/agrokart-react.log 2>&1 &
  )
  echo -e "${YELLOW}  ⟳ React is building (this takes ~30 seconds)...${NC}"
  
  # Wait for React to compile
  for i in $(seq 1 30); do
    sleep 2
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
      echo -e "${GREEN}  ✓ React Frontend running on http://localhost:3000${NC}"
      break
    fi
    if [ $i -eq 30 ]; then
      echo -e "${YELLOW}  ⚠ React is still starting (check /tmp/agrokart-react.log)${NC}"
    fi
  done
else
  echo -e "${RED}  ✗ client/node_modules missing. Run: cd client && npm install --legacy-peer-deps${NC}"
fi

echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}🚀 AgroKart is ready!${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}     ${GREEN}http://localhost:3000${NC}"
echo -e "  ${BOLD}API Backend:${NC}  ${GREEN}http://localhost:4000/api/health${NC}"
echo -e "  ${BOLD}RAG Service:${NC}  ${GREEN}http://localhost:8000/health${NC}"
echo -e "  ${BOLD}RAG Docs:${NC}     ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Logs: /tmp/agrokart-rag.log | /tmp/agrokart-server.log | /tmp/agrokart-react.log${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop monitoring (services continue in background)${NC}"

# Keep alive for monitoring
wait
