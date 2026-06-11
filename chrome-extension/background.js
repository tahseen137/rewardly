// Rewardly Chrome Extension — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Rewardly] Extension installed.");
});

function findMerchant(hostname, merchants) {
  const clean = hostname.replace(/^www\./, "");
  return merchants.find((m) =>
    m.urlPatterns.some(
      (pattern) =>
        clean === pattern ||
        clean.endsWith("." + pattern) ||
        clean.includes(pattern)
    )
  );
}

async function handlePageVisit(hostname) {
  console.log("[Rewardly] PAGE_VISIT:", hostname);

  // Check user settings
  const prefs = await chrome.storage.local.get({ showNotifications: true, minRate: 0 });
  if (!prefs.showNotifications) {
    console.log("[Rewardly] Notifications disabled in settings, skipping.");
    return;
  }

  // Deduplicate per session
  const notifKey = `notified-${hostname}`;
  const session = await chrome.storage.session.get([notifKey]);
  if (session[notifKey]) {
    console.log("[Rewardly] Already notified for", hostname, "this session.");
    return;
  }

  // Load merchant database
  const response = await fetch(chrome.runtime.getURL("data/merchants.json"));
  const data = await response.json();
  const merchant = findMerchant(hostname, data.merchants);

  if (!merchant) {
    console.log("[Rewardly] No merchant match for", hostname);
    return;
  }

  const sorted = [...merchant.rates].sort((a, b) => b.rate - a.rate);
  const best = sorted[0];

  if (best.rate < prefs.minRate) {
    console.log(`[Rewardly] Best rate ${best.rate}% is below minRate ${prefs.minRate}%, skipping.`);
    return;
  }

  const programLabels = {
    Rakuten: "Rakuten Canada",
    GCR: "Great Canadian Rebates",
    TopCashback: "TopCashback",
    Honey: "PayPal Honey",
  };
  const bestProgramLabel = programLabels[best.program] || best.program;

  console.log(`[Rewardly] Showing notification for ${merchant.name}: ${best.rate}% via ${bestProgramLabel}`);

  chrome.notifications.create(`rewardly-${Date.now()}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `💰 ${best.rate}% cashback at ${merchant.name}`,
    message: `Best rate: ${best.rate}% via ${bestProgramLabel}. Click the Rewardly icon to activate.`,
    priority: 2,
  });

  await chrome.storage.session.set({ [notifKey]: true });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PAGE_VISIT") {
    handlePageVisit(message.hostname)
      .catch((err) => console.error("[Rewardly] handlePageVisit error:", err));
    sendResponse({ ok: true });
  }
  return true;
});

chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId.startsWith("rewardly-")) {
    chrome.action.openPopup().catch(() => {
      // openPopup() requires user gesture on some platforms — silently ignore
    });
  }
});
