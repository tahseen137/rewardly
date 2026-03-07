/**
 * Rewardly Chrome Extension — Background Service Worker
 * Handles badge updates and merchant detection on tab changes
 */

const MERCHANTS_URL = chrome.runtime.getURL("data/merchants.json");

let merchantsData = null;

async function loadMerchants() {
  if (merchantsData) return merchantsData;
  try {
    const res = await fetch(MERCHANTS_URL);
    const json = await res.json();
    merchantsData = json.merchants;
    return merchantsData;
  } catch (e) {
    return [];
  }
}

function findMerchant(hostname, merchants) {
  const clean = hostname.replace(/^www\./, "");
  return merchants.find((m) =>
    m.urlPatterns.some(
      (p) => clean === p || clean.endsWith("." + p) || clean.includes(p)
    )
  );
}

function getBestRate(merchant) {
  if (!merchant || !merchant.rates || merchant.rates.length === 0) return null;
  return Math.max(...merchant.rates.map((r) => r.rate));
}

async function updateBadge(tabId, url) {
  try {
    if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
      chrome.action.setBadgeText({ text: "", tabId });
      return;
    }

    const hostname = new URL(url).hostname;
    const merchants = await loadMerchants();
    const merchant = findMerchant(hostname, merchants);

    if (!merchant) {
      chrome.action.setBadgeText({ text: "", tabId });
      return;
    }

    const bestRate = getBestRate(merchant);
    if (bestRate) {
      chrome.action.setBadgeText({ text: `${bestRate}%`, tabId });
      chrome.action.setBadgeBackgroundColor({ color: "#7C3AED", tabId });
    }
  } catch (e) {
    // Silent fail
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadge(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab.url) updateBadge(tabId, tab.url);
});

// On install
chrome.runtime.onInstalled.addListener(() => {
  console.log("Rewardly extension installed. Find cashback on every Canadian retailer.");
});
