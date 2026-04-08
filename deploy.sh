#!/bin/bash
set -e

echo "==============================="
echo "  Revengenation - AWS EC2 Deploy"
echo "==============================="

# 1. Latest code pull karo
echo "[1/5] Pulling latest code from Git..."
git pull origin main

# 2. Dependencies install karo
echo "[2/5] Installing dependencies..."
npm ci

# 3. Production build
echo "[3/5] Building Next.js app..."
npm run build

# 4. .env.local check karo
if [ ! -f ".env.local" ]; then
  echo "WARNING: .env.local not found! Environment variables set karo."
  exit 1
fi

# 5. PM2 se start/reload karo
echo "[4/5] Starting/Reloading PM2..."
if pm2 list | grep -q "revengenation"; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi

# 6. PM2 config save karo (server restart pe auto-start)
echo "[5/5] Saving PM2 config..."
pm2 save

echo ""
echo "Deployment complete! App is running on port 3000."
echo "Nginx ke through http://<EC2-PUBLIC-IP> pe accessible hoga."
