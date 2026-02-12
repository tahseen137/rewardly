# React Native Upgrade Roadmap

**Created:** Feb 12, 2026  
**Current Version:** React Native 0.81.5 (Aug 2025)  
**Latest Stable:** React Native 0.84.0 (Feb 11, 2026)  
**Status:** 🔴 3 versions behind, 0.81 now unsupported

---

## 🎯 Executive Summary

React Native 0.84 was released **yesterday** with significant performance improvements that directly benefit Rewardly:

- **Hermes V1 by default** → automatic execution speed + memory gains
- **Precompiled iOS binaries** → faster builds (no more compiling RN core from source)
- **Legacy Architecture removed** → smaller app size, faster builds
- **React 19.2.3** → latest React features and fixes

**Recommendation:** Schedule upgrade for **post-MVP** (after first paying customer milestone). Risk of breaking changes is too high during active sprint.

---

## 📊 Version Gap Analysis

| Version | Release Date | Key Changes | Migration Risk |
|---------|--------------|-------------|----------------|
| **0.81** (current) | Aug 2025 | Android 16, faster iOS builds | ✅ Stable |
| **0.82** | Oct 2025 | New Architecture only, Hermes V1 experimental | ⚠️ High (arch migration) |
| **0.83** | Dec 2025 | React 19.2, DevTools features, no breaking changes | ✅ Low |
| **0.84** | Feb 11, 2026 | Hermes V1 default, precompiled binaries, Node 22 | ⚠️ Medium |

**Cumulative Risk:** ⚠️ **High** — Jumping 3 versions includes the 0.82 New Architecture migration, which is the biggest breaking change in React Native history.

---

## 🚀 Performance Gains (0.81 → 0.84)

### Hermes V1 Engine
- **Execution speed:** 15-30% faster JavaScript execution (Meta benchmarks)
- **Memory usage:** 10-20% reduction in memory footprint
- **App startup:** 5-15% faster cold start times
- **Animation FPS:** More consistent 60fps on mid-range devices

**Impact on Rewardly:**
- ✅ Faster Sage AI responses (JS parsing overhead reduced)
- ✅ Smoother card list scrolling (FlatList performance)
- ✅ Better low-end device support (memory efficiency)

### Precompiled iOS Binaries
- **Clean build time:** ~40% faster (no RN core compilation)
- **CI/CD builds:** 2-5 min reduction per build
- **Developer experience:** Faster iteration cycles

**Impact on Motu Inc:**
- ✅ Faster deployments (EAS Build optimizations)
- ✅ Lower CI costs (fewer build minutes)
- ✅ Better developer velocity

### Smaller App Size
- **iOS:** 5-10% smaller IPA (Legacy Architecture code removed)
- **Android:** 3-7% smaller APK/AAB
- **Download time:** Reduced for users on slower connections

**Impact on Rewardly:**
- ✅ Higher install conversion (smaller downloads)
- ✅ Lower storage complaints (Canadian users often low on space)

---

## 🛠️ Technical Migration Requirements

### 1. New Architecture (0.82 Migration)

**What Changed:**
- Turbo Modules replace Native Modules
- Fabric replaces legacy UIManager
- JSI (JavaScript Interface) replaces Bridge

**Compatibility Check:**
```bash
# Run this to detect New Architecture incompatibilities
npx @react-native-community/cli config --platform all
```

**Known Incompatibilities (Rewardly Stack):**
- ✅ **React Navigation 7.x** → Already New Architecture compatible
- ✅ **Supabase JS** → Pure JS, no native bindings
- ✅ **Expo SDK 54** → Full New Architecture support
- ⚠️ **Custom Native Modules** → None in Rewardly (we're good!)

**Estimated Work:** 1-2 days (testing + edge case fixes)

### 2. Node.js 22 Upgrade

**Current:** Node.js 18+  
**Required:** Node.js 22.11+

**Migration Steps:**
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22
nvm alias default 22

# Verify version
node --version  # Should show v22.11+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Breaking Changes:**
- ESM resolution changes (doesn't affect Rewardly)
- Deprecated APIs removed (audit with `node --trace-deprecation`)

**Estimated Work:** 30 minutes

### 3. React 19.2 Migration

**Current:** React 19.1.0  
**Target:** React 19.2.3

**Breaking Changes:**
- None for our use case (mostly React Server Components features)
- TypeScript types updated (may need minor type fixes)

**Migration Steps:**
```bash
npm install react@19.2.3 react-dom@19.2.3
```

**Estimated Work:** 1 hour (testing + type fixes)

### 4. ESLint v9 Flat Config (Optional)

**Current:** ESLint v9.39.2 (already on v9!)  
**New:** Flat Config format supported

**Migration Steps:**
```bash
# Migrate .eslintrc.json → eslint.config.js
npx @eslint/migrate-config .eslintrc.json
```

**Benefit:** Simpler config, better performance, future-proof  
**Estimated Work:** 1 hour (config migration + testing)

---

## 📅 Recommended Upgrade Timeline

### Phase 1: Post-MVP Foundation (Week of Feb 17, 2026)
**After first paying customer milestone achieved**

**Tasks:**
- [ ] Upgrade Node.js to 22.11+
- [ ] Upgrade React Native 0.81 → 0.82 (New Architecture migration)
- [ ] Run full test suite + manual QA on iOS/Android
- [ ] Deploy to internal beta (Vercel staging + EAS Preview build)

**Estimated Time:** 2-3 days  
**Risk:** ⚠️ Medium (New Architecture is the big change)

### Phase 2: Incremental Stability (Week of Feb 24, 2026)
**After 0.82 stabilizes in production**

**Tasks:**
- [ ] Upgrade React Native 0.82 → 0.83
- [ ] Upgrade React to 19.2.3
- [ ] Test Sage AI streaming performance
- [ ] Deploy to production (phased rollout)

**Estimated Time:** 1 day  
**Risk:** ✅ Low (0.83 has no breaking changes)

### Phase 3: Performance Optimization (Week of Mar 3, 2026)
**After 0.83 proven stable**

**Tasks:**
- [ ] Upgrade React Native 0.83 → 0.84
- [ ] Enable Hermes V1 optimizations (already default)
- [ ] Verify precompiled iOS binaries working
- [ ] Benchmark performance gains (startup time, FPS, memory)
- [ ] Deploy to production

**Estimated Time:** 1-2 days  
**Risk:** ✅ Low (mostly performance wins)

### Phase 4: Cleanup & Documentation (Ongoing)
**After 0.84 production-proven**

**Tasks:**
- [ ] Migrate to ESLint v9 Flat Config
- [ ] Update all Expo packages to latest (SDK 55+)
- [ ] Document performance benchmarks
- [ ] Update deployment docs with new Node 22 requirement

**Estimated Time:** 1 day  
**Risk:** ✅ Low

---

## 🧪 Testing Checklist (Each Phase)

### Automated Tests
- [ ] `npm test` passes (Jest unit tests)
- [ ] `npm run lint` passes (ESLint)
- [ ] `npm run build:preview` succeeds (EAS Build)

### Manual QA
- [ ] iOS Simulator (iPhone 15 Pro)
- [ ] Android Emulator (Pixel 8)
- [ ] Real device: iPhone 12+ (test Hermes V1 perf)
- [ ] Real device: Mid-range Android (test memory usage)

### Core Flows
- [ ] App launch + splash screen
- [ ] Store search (Google Places API)
- [ ] Card recommendations (RecommendationEngine)
- [ ] My Cards screen (AsyncStorage persistence)
- [ ] Sage AI chat (Supabase Edge Function streaming)
- [ ] Settings + language toggle (i18next)

### Performance Benchmarks
- [ ] Cold start time (target: <2s on iPhone 12)
- [ ] Store search latency (target: <500ms)
- [ ] Sage AI TTFB (target: <400ms)
- [ ] FlatList scroll FPS (target: 60fps sustained)

---

## 💰 Cost-Benefit Analysis

### Costs
- **Dev Time:** 4-6 days total across all phases
- **QA Time:** 2-3 days regression testing
- **Risk:** Potential bugs introduced (mitigated by phased rollout)

### Benefits (Quantified)
| Benefit | Impact | Annual Value |
|---------|--------|--------------|
| **Faster CI builds** | 3 min/build × 100 builds/week | ~$240/year (EAS Pro savings) |
| **Better user retention** | 5% improvement from smoother UX | ~$5K-10K/year (at 10K MAU) |
| **Lower support load** | 10% fewer "app slow" complaints | ~$1K/year (support time) |
| **Future-proof** | Stay on supported RN versions | Priceless (tech debt avoided) |

**ROI:** High — payback period <1 month after first paying customers.

---

## 🚨 Known Risks & Mitigations

### Risk 1: New Architecture Breaking Changes
**Impact:** App crashes on certain devices/OS versions  
**Probability:** Medium (10-15% chance)

**Mitigation:**
- ✅ Phased rollout (10% → 50% → 100% over 1 week)
- ✅ Crashlytics monitoring (Firebase Crashlytics via Expo)
- ✅ Rollback plan (keep 0.81 branch for emergency revert)

### Risk 2: Third-Party Package Incompatibility
**Impact:** Some npm packages don't work with New Architecture  
**Probability:** Low (our stack is well-supported)

**Mitigation:**
- ✅ Audit dependencies before upgrade (use `npx @react-native-community/cli config`)
- ✅ Test all integrations in staging (Supabase, Google Places, Stripe)
- ✅ Have fallback versions documented

### Risk 3: Performance Regression
**Impact:** Upgrade makes app slower (rare but possible)  
**Probability:** Very Low (<5%)

**Mitigation:**
- ✅ Benchmark before/after (cold start, TTFB, FPS)
- ✅ Profile with React DevTools + Hermes profiler
- ✅ Rollback if benchmarks regress >10%

### Risk 4: Upgrade During High-Traffic Period
**Impact:** More users affected by potential bugs  
**Probability:** Medium (depends on timing)

**Mitigation:**
- ✅ Schedule upgrades during low-traffic hours (Mon-Wed mornings EST)
- ✅ Avoid upgrades during marketing campaigns
- ✅ Communicate with users via in-app banner ("New version rolling out")

---

## 📚 Resources & Documentation

### Official Guides
- [React Native 0.84 Release Blog](https://reactnative.dev/blog/2026/02/11/react-native-0.84)
- [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) — Code diffs between versions
- [New Architecture Migration Guide](https://reactnative.dev/docs/new-architecture-intro)
- [Hermes V1 Documentation](https://hermesengine.dev/)

### Expo Resources
- [Expo SDK 54 Changelog](https://expo.dev/changelog/2026/02-sdk-54)
- [EAS Build with React Native 0.84](https://docs.expo.dev/build-reference/infrastructure/)
- [Migrating to New Architecture with Expo](https://docs.expo.dev/guides/new-architecture/)

### Community
- [React Native Discord](https://discord.com/invite/react-native) — #upgrade-help channel
- [Expo Discord](https://chat.expo.dev) — #help channel
- [React Native Upgrade Support](https://github.com/react-native-community/upgrade-support) — File upgrade issues

---

## 🔄 Continuous Monitoring Post-Upgrade

### Metrics to Track (Amplitude/Mixpanel)
- App crash rate (target: <0.1%)
- Cold start time (target: <2s on iPhone 12)
- Sage AI response latency (target: <400ms TTFB)
- User retention (D1/D7/D30)
- App store rating (target: maintain 4.5+ stars)

### Alerts to Configure (Sentry/Crashlytics)
- Crash rate spike (>0.5% in any 1-hour window)
- ANR (Application Not Responding) on Android (>1% of sessions)
- JavaScript error rate spike (>2% of sessions)
- Hermes bytecode compilation errors

---

## 🎓 Key Learnings for Future Upgrades

### What Went Well (Anticipated)
- ✅ Phased rollout strategy caught issues early
- ✅ New Architecture migration smoother than expected (Expo abstracts complexity)
- ✅ Performance gains measurable and significant

### What Could Be Improved
- ⚠️ Should have upgraded incrementally (0.81→0.82→0.83→0.84) instead of waiting
- ⚠️ Need automated performance benchmarking in CI (catch regressions earlier)
- ⚠️ Dependency audit should be automated (detect New Architecture incompatibilities pre-upgrade)

### Next Time
- Upgrade React Native quarterly (stay within 1-2 versions of latest)
- Automate upgrade PRs with Renovate/Dependabot
- Maintain staging branch for testing prereleases

---

## ✅ Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Feb 12, 2026 | Defer upgrade until post-MVP | Risk too high during active sprint; first paying customer is priority |
| TBD | Approve Phase 1 (0.82) | New Architecture migration after MVP proven |
| TBD | Approve Phase 2 (0.83) | Low-risk stability upgrade |
| TBD | Approve Phase 3 (0.84) | Performance optimization after stability proven |

---

## 📝 Next Steps

### Immediate (This Week)
- [ ] Share this roadmap with Aragorn (get approval for post-MVP timeline)
- [ ] Add "React Native Upgrade" to Sprint Board backlog
- [ ] Monitor React Native release notes (subscribe to [reactnative.dev/blog](https://reactnative.dev/blog))

### Pre-Upgrade (Week of Feb 17)
- [ ] Audit all dependencies for New Architecture compatibility
- [ ] Set up performance benchmarking scripts (cold start, TTFB, FPS)
- [ ] Configure Crashlytics for phased rollout monitoring
- [ ] Create rollback plan (git branch + EAS Build downgrade procedure)

### Post-Upgrade (Week of Mar 10)
- [ ] Document actual performance gains (before/after benchmarks)
- [ ] Update all deployment docs with Node 22 requirement
- [ ] Share learnings with team (what worked, what didn't)
- [ ] Schedule next upgrade (stay current with React Native releases)

---

**Document Owner:** Gandalf (CTO)  
**Last Updated:** Feb 12, 2026  
**Next Review:** Post-MVP (after first paying customer)

---

*This roadmap is a living document. Update it as we learn more during the upgrade process.*
