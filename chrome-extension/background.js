// Rewardly Chrome Extension — Background Service Worker
// Recommends the best Canadian credit card for the merchant the user is visiting.

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.log("[Rewardly] Extension installed/updated. Reason:", reason);
  // Only open onboarding on fresh install, not on update/reload
  if (reason !== "install") return;
  const { walletIds = [] } = await chrome.storage.local.get({ walletIds: [] });
  if (!walletIds.length) {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function findMerchantByDomain(hostname, domainIndex, merchants) {
  const clean = hostname.replace(/^www\./, "").toLowerCase();
  // Direct match
  if (domainIndex[clean]) {
    return merchants.find(m => m.id === domainIndex[clean]);
  }
  // Subdomain match (e.g. ca.hotels.com → hotels.com)
  const parts = clean.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (domainIndex[candidate]) {
      return merchants.find(m => m.id === domainIndex[candidate]);
    }
  }
  return null;
}

function effectiveRate(card, cardCategory) {
  const catReward = card.categoryRewards?.find(cr => cr.category === cardCategory);
  const rate = catReward ? catReward.rewardRate : card.baseRewardRate;
  const val = rate.value;
  const type = rate.type;

  if (type === "cashback") {
    return {
      percent: val,
      label: `${val}% cash back`,
      raw: val,
      rawLabel: `${val}%`,
      type: "cashback",
    };
  } else {
    // points, airline_miles, hotel_points — all use pointValuation
    const pct = parseFloat((val * (card.pointValuation || 1)).toFixed(2));
    const program = card.rewardProgram || "Points";
    return {
      percent: pct,
      label: `${val}x ${program} (≈${pct.toFixed(1)}% value)`,
      raw: val,
      rawLabel: `${val}x`,
      type,
    };
  }
}

function getBestCard(wallet, cardCategory) {
  // wallet = array of card IDs
  // returns sorted array of { card, rate }
  return wallet
    .map(card => ({ card, rate: effectiveRate(card, cardCategory) }))
    .sort((a, b) => b.rate.percent - a.rate.percent);
}

// ─── Message handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PAGE_VISIT") {
    handlePageVisit(message.hostname).catch(err =>
      console.error("[Rewardly] handlePageVisit error:", err)
    );
    sendResponse({ ok: true });
  }

  if (message.type === "GET_RECOMMENDATION") {
    getRecommendation(message.hostname)
      .then(rec => sendResponse({ ok: true, ...rec }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true; // keep channel open for async
  }

  return true;
});

// ─── Page visit: auto-notification ──────────────────────────────────────────

async function handlePageVisit(hostname) {
  const prefs = await chrome.storage.local.get({
    showNotifications: true,
    minRate: 0,
    walletIds: [],
  });

  if (!prefs.showNotifications) return;
  if (!prefs.walletIds?.length) return;

  const notifKey = `notified-${hostname}`;
  const session = await chrome.storage.session.get([notifKey]);
  if (session[notifKey]) return;

  const rec = await getRecommendation(hostname);
  if (!rec.merchant || !rec.ranked?.length) return;

  const best = rec.ranked[0];
  if (best.rate.percent < prefs.minRate) return;

  chrome.notifications.create(`rewardly-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: `💳 Use your ${best.card.name.split(" ").slice(-2).join(" ")} at ${rec.merchant.name}`,
    message: `Earn ${best.rate.label}. Open Rewardly to see all your cards.`,
    priority: 2,
  });

  await chrome.storage.session.set({ [notifKey]: true });
}

// ─── Recommendation engine ───────────────────────────────────────────────────

async function getRecommendation(hostname) {
  const [merchantData, cardData, prefs] = await Promise.all([
    fetch(chrome.runtime.getURL("data/merchants.json")).then(r => r.json()),
    fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json()),
    chrome.storage.local.get({ walletIds: [] }),
  ]);

  const merchant = findMerchantByDomain(
    hostname,
    merchantData.domainIndex,
    merchantData.merchants
  );

  if (!merchant) return { merchant: null, ranked: [] };

  const walletCards = prefs.walletIds
    .map(id => cardData.cards.find(c => c.id === id))
    .filter(Boolean);

  const ranked = getBestCard(walletCards, merchant.cardCategory);

  // Track this visit for savings
  await recordVisit(merchant);

  return { merchant, ranked };
}

// ─── Savings tracking ────────────────────────────────────────────────────────

async function recordVisit(merchant) {
  const data = await chrome.storage.local.get({ visits: [] });
  const visits = data.visits || [];
  visits.push({
    merchantId: merchant.id,
    category: merchant.cardCategory,
    ts: Date.now(),
  });
  // Keep last 500 visits
  if (visits.length > 500) visits.splice(0, visits.length - 500);
  await chrome.storage.local.set({ visits });
}

// ─── Notification click → open popup ────────────────────────────────────────

chrome.notifications.onClicked.addListener(notifId => {
  if (notifId.startsWith("rewardly-")) {
    chrome.action.openPopup().catch(() => {});
  }
});
