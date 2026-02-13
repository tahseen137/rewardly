# Rewardly Deploy Checklist

> **⚠️ MANDATORY: Complete ALL checks before deploying to production**
> 
> This checklist exists because of a production incident where undefined color references caused a white screen crash on web. Zero tolerance for white-screen deploys.

## Quick Deploy Command

```bash
# This runs all validation checks before deploying
npm run deploy:vercel
```

---

## Pre-Deploy Checklist

### 1. ✅ Code Quality

- [ ] **TypeScript compiles without errors**
  ```bash
  npm run typecheck
  ```

- [ ] **Linting passes**
  ```bash
  npm run lint
  ```

- [ ] **Unit tests pass**
  ```bash
  npm run test
  ```

### 2. ✅ Web Build Verification

- [ ] **Web export builds successfully**
  ```bash
  npm run test:web
  ```
  This catches:
  - Missing web polyfills
  - Undefined imports
  - Native-only code without Platform checks

- [ ] **Local web preview works**
  ```bash
  npm run build:web
  npx serve dist -l 3000
  # Open http://localhost:3000 and verify:
  # - App loads (not white screen)
  # - No console errors
  # - Auth screen renders correctly
  ```

### 3. ✅ Native Module Safety

- [ ] **All native imports use Platform checks**
  
  Search for dangerous direct imports:
  ```bash
  grep -r "from 'expo-haptics'" src/ --include="*.tsx" --include="*.ts"
  grep -r "from 'expo-location'" src/ --include="*.tsx" --include="*.ts"
  grep -r "from 'expo-notifications'" src/ --include="*.tsx" --include="*.ts"
  ```
  
  ✅ **Good**: Import from `src/utils/platform.ts`
  ❌ **Bad**: Direct import from native modules

- [ ] **Theme colors exist**
  
  If you added new color references, verify they exist:
  ```bash
  # Check for any colors.semantic.* usage (doesn't exist!)
  grep -r "colors\.semantic\." src/ --include="*.tsx" --include="*.ts"
  # Should return empty
  ```

### 4. ✅ Error Boundary Coverage

- [ ] **New screens have error boundaries**
  
  Heavy screens should use lazy loading:
  ```typescript
  // In navigation
  const MyNewScreen = lazyScreen(
    () => import('../screens/MyNewScreen'),
    { screenName: 'MyNewScreen' }
  );
  ```

### 5. ✅ Console Check

- [ ] **No console errors in browser**
  
  Open Chrome DevTools Console and verify:
  - No red errors
  - No unhandled promise rejections
  - No "undefined is not an object" errors

---

## Common Pitfalls

### ❌ DON'T: Use undefined color paths
```typescript
// WRONG - colors.semantic doesn't exist
color={colors.semantic.success}

// RIGHT
color={colors.success.main}
```

### ❌ DON'T: Import native modules directly
```typescript
// WRONG - crashes on web
import * as Haptics from 'expo-haptics';

// RIGHT - use platform wrapper
import { haptic } from '../utils/platform';
```

### ❌ DON'T: Use reanimated layout animations without checks
```typescript
// WRONG - may crash on web
import Animated, { FadeInDown } from 'react-native-reanimated';
<Animated.View entering={FadeInDown}>

// RIGHT - check platform or use standard Animated
import { supportsLayoutAnimations } from '../utils/platform';
if (supportsLayoutAnimations()) {
  // use reanimated
} else {
  // use fallback
}
```

### ❌ DON'T: Skip the web build test
```bash
# ALWAYS run this before deploying
npm run test:web
```

---

## Emergency Rollback

If a bad deploy goes out:

1. **Revert to last working commit**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Force Vercel redeploy**
   ```bash
   vercel --prod --force
   ```

3. **Verify the site loads**
   ```bash
   curl -s https://rewardly-cyan.vercel.app | grep -q "index-" && echo "✅ Site loads"
   ```

---

## Automated Validation

The `npm run validate` command runs:
1. `npm run lint` - ESLint checks
2. `npm run typecheck` - TypeScript compilation
3. `npm run test:web` - Web build smoke test

**This is automatically run by `npm run deploy:vercel`**

---

## Incident History

| Date | Issue | Root Cause | Prevention |
|------|-------|------------|------------|
| 2026-02-12 | White screen on web | `colors.semantic.success` undefined | Added platform.ts, this checklist |

---

*Last updated: 2026-02-12*
*Maintainer: Rewardly Engineering Team*
