// Rewardly — Settings Page

const DEFAULTS = { showNotifications: true, minRate: 0 };

async function init() {
  const [prefs, { walletIds = [] }] = await Promise.all([
    chrome.storage.local.get(DEFAULTS),
    chrome.storage.local.get({ walletIds: [] }),
  ]);

  document.getElementById("showNotifications").checked = prefs.showNotifications;
  document.getElementById("minRate").value = prefs.minRate;

  // Wallet summary
  document.getElementById("walletCount").textContent =
    `${walletIds.length} card${walletIds.length !== 1 ? "s" : ""} in your wallet`;

  if (walletIds.length) {
    try {
      const cardData = await fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json());
      const names = walletIds
        .map(id => cardData.cards.find(c => c.id === id)?.name)
        .filter(Boolean)
        .slice(0, 5);
      document.getElementById("walletPreview").textContent = names.join(" · ") +
        (walletIds.length > 5 ? ` · +${walletIds.length - 5} more` : "");
    } catch {}
  }

  document.getElementById("editWalletBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  });

  document.getElementById("saveBtn").addEventListener("click", saveSettings);
}

async function saveSettings() {
  const settings = {
    showNotifications: document.getElementById("showNotifications").checked,
    minRate: parseInt(document.getElementById("minRate").value, 10),
  };

  await chrome.storage.local.set(settings);

  const confirmEl = document.getElementById("saveConfirm");
  confirmEl.style.color = "#10B981";
  confirmEl.textContent = "✓ Settings saved";
  setTimeout(() => { confirmEl.textContent = ""; }, 2500);
}

document.addEventListener("DOMContentLoaded", init);
