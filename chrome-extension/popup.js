/**
 * Rewardly Chrome Extension — Popup
 * Shows the best Canadian credit card for the current merchant.
 */

const CATEGORY_ICONS = {
  groceries: "🛒",
  gas: "⛽",
  dining: "🍽️",
  drugstores: "💊",
  travel: "✈️",
  streaming: "📺",
  entertainment: "🎬",
  transit: "🚇",
  recurring: "📱",
  general: "🛍️",
};

const LOYALTY_INFO = {
  "pc-optimum": { name: "PC Optimum", tip: "Stack PC Optimum points on top of your credit card rewards here." },
  "scene-plus": { name: "Scene+", tip: "Stack Scene+ points on top of your credit card rewards here." },
  "triangle": { name: "Triangle Rewards", tip: "Stack Triangle Rewards on top of your credit card here." },
  "aeroplan": { name: "Aeroplan", tip: "Earn Aeroplan miles here — stack on top of your card points." },
  "air-miles": { name: "Air Miles", tip: "Earn Air Miles here — stack on top of your card rewards." },
};

function showState(id) {
  ["stateSetup", "stateMerchant", "stateNoMerchant", "stateLoading"].forEach(s => {
    document.getElementById(s)?.classList.toggle("hidden", s !== id);
  });
}

function formatRateShort(rate) {
  if (rate.type === "cashback") return `${rate.raw}%`;
  return `${rate.raw}x`;
}

async function main() {
  showState("stateLoading");

  const { walletIds = [] } = await chrome.storage.local.get({ walletIds: [] });

  if (!walletIds.length) {
    showState("stateSetup");
    document.getElementById("setupBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
      window.close();
    });
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let hostname = null;
  try { hostname = tab?.url ? new URL(tab.url).hostname : null; } catch {}

  if (!hostname) {
    await showWalletSummary(walletIds);
    return;
  }

  const rec = await chrome.runtime.sendMessage({ type: "GET_RECOMMENDATION", hostname });

  if (!rec?.ok || !rec.merchant || !rec.ranked?.length) {
    await showWalletSummary(walletIds);
    return;
  }

  renderMerchantView(rec);
}

function renderMerchantView({ merchant, ranked }) {
  showState("stateMerchant");

  document.getElementById("merchantIcon").textContent = CATEGORY_ICONS[merchant.cardCategory] || "🛍️";
  document.getElementById("merchantName").textContent = merchant.name;
  document.getElementById("merchantCategory").textContent = merchant.displayCategory;

  const best = ranked[0];
  document.getElementById("bestCardIssuer").textContent = best.card.issuer;
  document.getElementById("bestCardName").textContent = best.card.name;
  document.getElementById("bestCardRate").textContent = formatRateShort(best.rate);

  // Loyalty tip
  const loyaltySection = document.getElementById("loyaltySection");
  const loyaltyTip = document.getElementById("loyaltyTip");
  const programs = (merchant.loyalty || []).filter(p => LOYALTY_INFO[p]);
  if (programs.length) {
    const info = LOYALTY_INFO[programs[0]];
    loyaltyTip.innerHTML = `<strong>💡 ${info.name}</strong> — ${info.tip}`;
    loyaltySection.classList.remove("hidden");
  }

  // Other wallet cards
  const others = ranked.slice(1);
  const otherSection = document.getElementById("otherCardsSection");
  const otherList = document.getElementById("otherCardsList");
  if (others.length) {
    otherList.innerHTML = "";
    others.forEach(({ card, rate }) => {
      const row = document.createElement("div");
      row.className = "other-card-row";
      row.innerHTML = `
        <div class="other-card-info">
          <div class="other-card-name">${card.name}</div>
          <div class="other-card-issuer">${card.issuer}</div>
        </div>
        <div class="other-card-rate">${formatRateShort(rate)}</div>
      `;
      otherList.appendChild(row);
    });
    otherSection.classList.remove("hidden");
  }

  checkUpgrade(merchant, ranked);
}

async function checkUpgrade(merchant, ranked) {
  try {
    const { walletIds = [] } = await chrome.storage.local.get({ walletIds: [] });
    const cardData = await fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json());
    const nonWallet = cardData.cards.filter(c => c.country === "CA" && !walletIds.includes(c.id));
    const bestInWallet = ranked[0]?.rate?.percent || 0;

    const best = nonWallet
      .map(card => {
        const cr = card.categoryRewards?.find(r => r.category === merchant.cardCategory);
        const rate = cr ? cr.rewardRate : card.baseRewardRate;
        const pct = rate.type === "cashback"
          ? rate.value
          : parseFloat(((rate.value * card.pointValuation) / 100).toFixed(2));
        return { card, pct };
      })
      .sort((a, b) => b.pct - a.pct)[0];

    if (best && best.pct > bestInWallet + 1) {
      const upgradeSection = document.getElementById("upgradeSection");
      document.getElementById("upgradeTip").innerHTML =
        `<strong>💡 Upgrade tip</strong> — The <strong>${best.card.name}</strong> earns ` +
        `≈${best.pct.toFixed(1)}% here vs your ≈${bestInWallet.toFixed(1)}%.`;
      upgradeSection.classList.remove("hidden");
    }
  } catch {}
}

async function showWalletSummary(walletIds) {
  showState("stateNoMerchant");
  const walletList = document.getElementById("walletList");
  walletList.innerHTML = "";

  if (!walletIds.length) {
    walletList.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:8px 0">No cards added yet.</p>`;
    return;
  }

  try {
    const cardData = await fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json());
    walletIds.slice(0, 5).forEach(id => {
      const card = cardData.cards.find(c => c.id === id);
      if (!card) return;
      const row = document.createElement("div");
      row.className = "wallet-card-row";
      row.innerHTML = `
        <div class="wallet-card-info">
          <div class="wallet-card-name">${card.name}</div>
          <div class="wallet-card-issuer">${card.issuer}</div>
        </div>
      `;
      walletList.appendChild(row);
    });
    if (walletIds.length > 5) {
      const more = document.createElement("p");
      more.style.cssText = "font-size:12px;color:var(--text-dim);text-align:center;padding-top:4px";
      more.textContent = `+${walletIds.length - 5} more in wallet`;
      walletList.appendChild(more);
    }
  } catch {}
}

document.getElementById("settingsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.addEventListener("DOMContentLoaded", main);
