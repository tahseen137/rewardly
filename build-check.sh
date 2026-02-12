#!/bin/bash
# Quick build sanity check

echo "🔨 Running build sanity check..."
echo ""

cd /Users/clawdbot/.openclaw/workspace/rewardly

# Start metro bundler in background
npx expo start --web --no-dev > /tmp/expo-build.log 2>&1 &
EXPO_PID=$!

echo "Metro bundler starting (PID: $EXPO_PID)..."
echo "Waiting for bundle to compile..."

# Wait for either success or failure indicators in log
for i in {1..45}; do
  sleep 2
  
  # Check for errors
  if grep -q "error" /tmp/expo-build.log 2>/dev/null; then
    echo ""
    echo "❌ Build errors detected:"
    grep -A 3 "error" /tmp/expo-build.log | head -20
    kill $EXPO_PID 2>/dev/null
    exit 1
  fi
  
  # Check for success
  if grep -q "Bundled" /tmp/expo-build.log 2>/dev/null || \
     grep -q "Compiled successfully" /tmp/expo-build.log 2>/dev/null; then
    echo ""
    echo "✅ Build successful!"
    kill $EXPO_PID 2>/dev/null
    exit 0
  fi
  
  # Progress indicator
  if [ $((i % 5)) -eq 0 ]; then
    echo -n "."
  fi
done

echo ""
echo "⏱️  Timeout - showing last 30 lines of log:"
tail -30 /tmp/expo-build.log
kill $EXPO_PID 2>/dev/null
exit 2
