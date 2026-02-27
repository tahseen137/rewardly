# Mobile QA Report v3 — Rewardly.ca

**Date:** 2026-02-27  
**Tester:** Gandalf (Automated + Visual QA)  
**Viewports tested:** 375x812 (iPhone 14), 390x844 (iPhone 14 Pro), 414x896 (iPhone 11)  
**URL:** https://rewardly.ca

---

## Summary

| Metric | Result |
|--------|--------|
| Horizontal scroll | ✅ None detected |
| Small tap targets (<44px) | ✅ No critical buttons |
| Text overflow | ✅ None detected |
| Navigation header | ❌ MISSING (fixed in this PR) |
| Hero top padding (mobile) | ⚠️ 80px was too large (reduced to 48px) |
| Full-page load time | ~3-5 seconds (React Native Web) |

---

## Issues Found (Top 10)

### 🔴 Critical (Fixed)

**Issue 1: Missing Navigation Header**  
- **Description:** The LandingPage had no header/navbar. Users on mobile had no visible logo, no way to access other pages, no login link.
- **Viewport(s):** All mobile viewports
- **Fix:** Added `NavHeader` component (sticky header with logo + "Get Started" CTA button). Added `stickyHeaderIndices={[0]}` to ScrollView so nav sticks on scroll.
- **Status:** ✅ Fixed

**Issue 2: Excessive Hero Top Padding on Mobile**  
- **Description:** `heroGradient.paddingTop` was hardcoded to 80px. On iPhone 14 (375x812), this pushed all hero content below the fold causing poor above-the-fold experience.
- **Viewport(s):** iPhone 14 (375x812), iPhone 14 Pro (390x844), iPhone 11 (414x896)
- **Fix:** Reduced to 48px on mobile (`SCREEN_WIDTH <= 768`). Kept 80px on desktop.
- **Status:** ✅ Fixed

---

### 🟡 Medium (Not Fixed — Backlog)

**Issue 3: No Social Proof Above the Fold**  
- **Description:** No testimonials, user count, or star ratings visible in hero section. For a financial tool, trust signals are critical for conversion.
- **Recommendation:** Add "Trusted by X Canadians" or 5-star rating below CTA buttons.
- **Status:** ⚠️ Backlog

**Issue 4: "#1 Rewards Optimizer" Badge Has No Source**  
- **Description:** "Canada's #1 Rewards Optimizer" appears as a self-proclaimed badge without citation. May reduce trust.
- **Recommendation:** Either source the claim (e.g., "Product Hunt #1") or change to "Most Powerful" or "Built for Canadians."
- **Status:** ⚠️ Backlog

**Issue 5: Stats Lack Context**  
- **Description:** "$127 avg. saved/month" and "50+ Canadian cards" need more context. Saved vs what? 50+ cards analyzed vs supported?
- **Recommendation:** Add tooltips or sub-labels: "50+ cards analyzed", "$127 vs using 1 card"
- **Status:** ⚠️ Backlog

**Issue 6: "Try Demo" CTA is Styled as Text Link**  
- **Description:** Secondary CTA ("Try Demo (no signup)") is a plain text link vs a ghost/outline button. Low visual weight on mobile.
- **Recommendation:** Make it an outlined button to give it clear tap affordance.
- **Status:** ⚠️ Backlog

**Issue 7: No Scroll Indicator Below Fold**  
- **Description:** Page looks complete at first glance. No arrow, animation, or "scroll to learn more" indicator.
- **Recommendation:** Add animated chevron or "↓ See how it works" text.
- **Status:** ⚠️ Backlog

---

### 🟢 Minor (Not Fixed)

**Issue 8: Small Gray Disclaimer Text Contrast**  
- **Description:** "No credit card required · Free forever plan available" text uses low-opacity gray on dark background. WCAG AA pass but borderline.
- **Recommendation:** Increase opacity from ~50% to 70%.

**Issue 9: Footer Not Visible on First Load**  
- **Description:** The footer links (Product, Legal, Support) are only accessible after significant scrolling. No link to privacy policy or terms in the header.

**Issue 10: No Back-to-Top Button for Long Scroll**  
- **Description:** Landing page is long (features + pricing + trust + CTA + footer). No back-to-top on mobile.

---

## Fixes Implemented

```
src/screens/LandingPage.tsx:
  + Added NavHeader component (sticky logo + Get Started CTA, 56px tall)
  + Added stickyHeaderIndices={[0]} to ScrollView
  + Reduced heroGradient.paddingTop: 80 → 48px on mobile
  + Reduced heroGradient.paddingBottom: 80 → 56px on mobile
```

---

## Screenshots

| Viewport | Type | File |
|----------|------|------|
| iPhone 14 (375x812) | Above fold | `qa-v2-home.png` |
| iPhone 14 (375x812) | Full page | `qa-v2-full.png` |

---

## Deployment Status

- **Branch:** feature/og-twitter-meta-tags
- **Vercel:** Auto-deploys on push — check https://rewardly.ca after merge
