// Rewardly Chrome Extension — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("Rewardly extension installed. Find cashback on every Canadian retailer.");
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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "PAGE_VISIT") {
    const { hostname } = message;
    const notifKey = `notified-${hostname}`;

    chrome.storage.local.get({ showNotifications: true, minRate: 0 }, (prefs) => {
      if (!prefs.showNotifications) return;

      chrome.storage.session.get([notifKey], (result) => {
        if (result[notifKey]) return;

        fetch(chrome.runtime.getURL("data/merchants.json"))
          .then((r) => r.json())
          .then((data) => {
            const merchant = findMerchant(hostname, data.merchants);
            if (!merchant) return;

            const sorted = [...merchant.rates].sort((a, b) => b.rate - a.rate);
            const best = sorted[0];
            if (best.rate < prefs.minRate) return;

            const programLabels = {
              Rakuten: "Rakuten Canada",
              GCR: "Great Canadian Rebates",
              TopCashback: "TopCashback",
              Honey: "PayPal Honey",
            };
            const bestProgramLabel = programLabels[best.program] || best.program;

            chrome.notifications.create(`rewardly-${hostname}`, {
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: `💰 ${best.rate}% cashback at ${merchant.name}`,
              message: `Best rate: ${best.rate}% via ${bestProgramLabel}. Open Rewardly to compare all rates and activate.`,
              buttons: [{ title: "Open Rewardly" }],
              requireInteraction: false,
              priority: 1,
            });

            chrome.storage.session.set({ [notifKey]: true });
          })
          .catch((err) => console.error("Rewardly PAGE_VISIT error:", err));
      });
    });

    sendResponse({ ok: true });
  }

  return true;
});

chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
  if (notifId.startsWith("rewardly-") && buttonIndex === 0) {
    chrome.action.openPopup();
  }
});
