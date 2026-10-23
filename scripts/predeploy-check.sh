#!/bin/bash
# Pre-Deploy Check Script for Rewardly
# Comprehensive validation before any deployment

set -e  # Exit on first failure

echo "🔒 REWARDLY PRE-DEPLOY CHECK"
echo "===================================="
echo "Running comprehensive checks before deployment..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
CHECKS_PASSED=0
CHECKS_FAILED=0
CRITICAL_FAILURE=false

# Function to run a check
run_check() {
  local check_name="$1"
  local check_command="$2"
  local is_critical="${3:-true}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 $check_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if eval "$check_command"; then
    echo -e "${GREEN}✅ PASS:${NC} $check_name"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL:${NC} $check_name"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    
    if [ "$is_critical" = "true" ]; then
      CRITICAL_FAILURE=true
    fi
  fi
  
  echo ""
}

# Start checks
echo "Starting pre-deploy validation..."
echo ""

# Check 1: TypeScript Compilation
run_check \
  "TypeScript Compilation" \
  "npm run typecheck 2>&1 | tee /tmp/typecheck.log && grep -q 'Found 0 errors' /tmp/typecheck.log" \
  true

# Check 2: ESLint
run_check \
  "ESLint" \
  "npm run lint 2>&1 | tee /tmp/lint.log && (tail -1 /tmp/lint.log | grep -q '0 errors' || grep -q 'All files pass linting' /tmp/lint.log)" \
  false

# Check 3: Unit Tests
run_check \
  "Unit Tests" \
  "npm test -- --ci --silent 2>&1 | tee /tmp/test.log && grep -q 'Tests:.*passed' /tmp/test.log" \
  true

# Check 4: Web Build
run_check \
  "Web Build (Expo Export)" \
  "npm run build:web > /tmp/build.log 2>&1" \
  true

# Check 5: Smoke Test
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Running Smoke Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "./scripts/smoke-test.sh" ]; then
  if bash ./scripts/smoke-test.sh; then
    echo -e "${GREEN}✅ PASS:${NC} Smoke Test Suite"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${RED}❌ FAIL:${NC} Smoke Test Suite"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    CRITICAL_FAILURE=true
  fi
else
  echo -e "${YELLOW}⚠️  WARN:${NC} Smoke test script not found"
fi

echo ""

# Final Summary
echo "===================================="
echo "📊 PRE-DEPLOY CHECK SUMMARY"
echo "===================================="
echo ""
echo -e "✅ Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "❌ Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ "$CRITICAL_FAILURE" = true ] || [ $CHECKS_FAILED -gt 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${RED}🚨 PRE-DEPLOY CHECK FAILED${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "❌ DO NOT DEPLOY - Fix failures first"
  echo ""
  echo "Review logs in /tmp/ for details:"
  echo "  • /tmp/typecheck.log"
  echo "  • /tmp/lint.log"
  echo "  • /tmp/test.log"
  echo "  • /tmp/build.log"
  echo ""
  exit 1
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}✅ PRE-DEPLOY CHECK PASSED${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "✅ All checks passed - Safe to deploy"
  echo ""
  echo "Deployment authorized. Proceed with:"
  echo "  npm run deploy:vercel"
  echo ""
  exit 0
fi
