#!/bin/bash
# Smoke Test Script for Rewardly
# Runs basic sanity checks before deployment

set -e  # Exit on first failure

echo "🔥 Running Rewardly Smoke Tests..."
echo "=================================="
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to report test result
test_result() {
  if [ $1 -eq 0 ]; then
    echo "✅ PASS: $2"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo "❌ FAIL: $2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  echo ""
}

# Test 1: Unit Tests
echo "📝 Test 1: Running unit tests..."
if npm test -- --ci --silent 2>&1 | grep -q "Tests:.*passed"; then
  test_result 0 "Unit tests"
else
  test_result 1 "Unit tests"
fi

# Test 2: TypeScript Compilation
echo "🔍 Test 2: Checking TypeScript compilation..."
if npm run typecheck 2>&1 | grep -q "Found 0 errors"; then
  test_result 0 "TypeScript compilation"
else
  test_result 1 "TypeScript compilation"
fi

# Test 3: Build Check
echo "🏗️  Test 3: Building for web..."
if npm run build:web > /dev/null 2>&1; then
  test_result 0 "Web build"
else
  test_result 1 "Web build"
fi

# Test 4: Lint Check
echo "🧹 Test 4: Running ESLint..."
if npm run lint 2>&1 | tail -1 | grep -q "0 errors"; then
  test_result 0 "Lint check"
else
  test_result 1 "Lint check"
fi

# Summary
echo "=================================="
echo "📊 SMOKE TEST SUMMARY"
echo "=================================="
echo "✅ Passed: $TESTS_PASSED"
echo "❌ Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
  echo "🚨 SMOKE TEST FAILED - DO NOT DEPLOY"
  echo ""
  exit 1
else
  echo "✅ SMOKE TEST PASSED - Safe to deploy"
  echo ""
  exit 0
fi
