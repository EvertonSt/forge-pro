#!/bin/bash
# Forge-Pro Vercel Deployment Script
# Deploys the main app + all 10 templates to Vercel (free tier)
#
# Prerequisites:
#   1. Install Vercel CLI: npm i -g vercel
#   2. Login: vercel login
#   3. Run this script from the forge-pro root
#
# Usage:
#   ./scripts/deploy-vercel.sh          # Deploy all
#   ./scripts/deploy-vercel.sh --app    # Deploy main app only
#   ./scripts/deploy-vercel.sh --templates  # Deploy templates only
#   ./scripts/deploy-vercel.sh --dry-run   # Preview without deploying

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DRY_RUN=false
DEPLOY_APP=true
DEPLOY_TEMPLATES=true

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --app) DEPLOY_TEMPLATES=false ;;
    --templates) DEPLOY_APP=false ;;
    --help)
      echo "Usage: ./scripts/deploy-vercel.sh [options]"
      echo ""
      echo "Options:"
      echo "  --app        Deploy main app only"
      echo "  --templates  Deploy templates only"
      echo "  --dry-run    Preview without deploying"
      echo "  --help       Show this help"
      exit 0
      ;;
  esac
done

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Forge-Pro Vercel Deployment Script             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}✗ Vercel CLI not found. Install it first:${NC}"
  echo "  npm i -g vercel"
  exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo -e "${YELLOW}⚠ Not logged in to Vercel. Please login:${NC}"
  vercel login
fi

echo -e "${GREEN}✓ Logged in as: $(vercel whoami)${NC}"
echo ""

# Template list with names and directories
TEMPLATES=(
  "nimbus"
  "atlas"
  "lumen"
  "studio"
  "forge"
  "pulse"
  "sage"
  "mesa"
  "ledger"
  "quill"
)

# Deploy function
deploy_project() {
  local name=$1
  local dir=$2
  local cmd=$3
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Deploying: ${name}${NC}"
  echo -e "${BLUE}Directory: ${dir}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN] Would deploy ${name} from ${dir}${NC}"
    echo ""
    return
  fi
  
  cd "$dir"
  
  # Deploy with auto-confirm
  vercel --yes --prod 2>&1 | while IFS= read -r line; do
    if [[ "$line" == *"https://"*".vercel.app"* ]]; then
      echo -e "${GREEN}✓ Deployed: $line${NC}"
    fi
  done
  
  cd - > /dev/null
  echo ""
}

# Deploy main app
if [ "$DEPLOY_APP" = true ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║               Deploying Main App                       ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
  
  deploy_project "forge-pro" "apps/app" "next build"
fi

# Deploy templates
if [ "$DEPLOY_TEMPLATES" = true ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║              Deploying Templates (10)                  ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  for template in "${TEMPLATES[@]}"; do
    deploy_project "$template" "templates/$template" "npm run build"
  done
fi

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Deployment Complete!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Your deployed URLs:${NC}"
echo ""

if [ "$DEPLOY_APP" = true ]; then
  echo -e "  ${GREEN}•${NC} Main App:    https://forge-pro.vercel.app"
fi

if [ "$DEPLOY_TEMPLATES" = true ]; then
  for template in "${TEMPLATES[@]}"; do
    echo -e "  ${GREEN}•${NC} ${template^}:     https://${template}-forge.vercel.app"
  done
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Add environment variables in Vercel Dashboard"
echo "  2. Connect custom domains (optional)"
echo "  3. Set up Supabase project"
echo ""
echo -e "${BLUE}Vercel Dashboard: https://vercel.com/dashboard${NC}"
