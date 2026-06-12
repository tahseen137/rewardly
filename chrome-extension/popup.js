/**
 * Rewardly Chrome Extension — Popup
 * Recommendation logic runs directly here — no background message needed.
 */

// ─── Shared helpers (mirrored from background.js) ──────────────────────────

function findMerchantByDomain(hostname, domainIndex, merchants) {
  const clean = hostname.replace(/^www\./, "").toLowerCase();
  if (domainIndex[clean]) return merchants.find(m => m.id === domainIndex[clean]);
  const parts = clean.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (domainIndex[candidate]) return merchants.find(m => m.id === domainIndex[candidate]);
  }
  return null;
}

function effectiveRate(card, cardCategory) {
  const catReward = card.categoryRewards?.find(cr => cr.category === cardCategory);
  const rate = catReward ? catReward.rewardRate : card.baseRewardRate;
  const val = rate.value;
  const type = rate.type;
  if (type === "cashback") {
    return { percent: val, label: `${val}% cash back`, raw: val, type: "cashback" };
  }
  const pct = parseFloat(((val * (card.pointValuation || 1)) / 100).toFixed(2));
  const program = card.rewardProgram || "Points";
  return {
    percent: pct,
    label: `${val}x ${program} (≈${pct.toFixed(1)}% value)`,
    raw: val,
    type,
  };
}

function getBestCards(walletCards, cardCategory) {
  return walletCards
    .map(card => ({ card, rate: effectiveRate(card, cardCategory) }))
    .sort((a, b) => b.rate.percent - a.rate.percent);
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  groceries: "🛒", gas: "⛽", dining: "🍽️", drugstores: "💊",
  travel: "✈️", streaming: "📺", entertainment: "🎬", transit: "🚇",
  recurring: "📱", general: "🛍️",
};

const LOYALTY_INFO = {
  "pc-optimum":  { name: "PC Optimum",      tip: "Stack PC Optimum points on top of your credit card rewards here." },
  "scene-plus":  { name: "Scene+",          tip: "Stack Scene+ points on top of your credit card rewards here." },
  "triangle":    { name: "Triangle Rewards",tip: "Stack Triangle Rewards on top of your credit card here." },
  "aeroplan":    { name: "Aeroplan",         tip: "Earn Aeroplan miles here — stack on top of your card points." },
  "air-miles":   { name: "Air Miles",        tip: "Earn Air Miles here — stack on top of your card rewards." },
};

function showState(id) {
  ["stateSetup", "stateMerchant", "stateNoMerchant", "stateLoading", "stateError"].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle("hidden", s !== id);
  });
}

function formatRateShort(rate) {
  if (rate.type === "cashback") return `${rate.raw}%`;
  return `${rate.raw}x`;
}

// ─── Debug panel ─────────────────────────────────────────────────────────────

function setDebug(msg, color) {
  const el = document.getElementById("debugLine");
  if (!el) return;
  el.textContent = msg;
  el.style.color = color || "var(--text-dim)";
  el.style.display = "block";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  showState("stateLoading");
  setDebug("v2.1 loading…");

  try {
    const { walletIds = [] } = await chrome.storage.local.get({ walletIds: [] });
    setDebug(`wallet: ${walletIds.length} cards`);

    if (!walletIds.length) {
      showState("stateSetup");
      setDebug("no wallet — go add cards");
      document.getElementById("setupBtn").addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
        window.close();
      });
      return;
    }

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let hostname = null;
    try { hostname = tab?.url ? new URL(tab.url).hostname : null; } catch {}
    setDebug(`host: ${hostname || "(none)"}`);

    if (!hostname) {
      await showWalletSummary(walletIds);
      return;
    }

    // Load data and compute recommendation directly in popup
    const [merchantData, cardData] = await Promise.all([
      fetch(chrome.runtime.getURL("data/merchants.json")).then(r => r.json()),
      fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json()),
    ]);

    const merchant = findMerchantByDomain(hostname, merchantData.domainIndex, merchantData.merchants);
    setDebug(`merchant: ${merchant ? merchant.name : "not found"}`);

    if (!merchant) {
      await showWalletSummary(walletIds, cardData);
      return;
    }

    const walletCards = walletIds
      .map(id => cardData.cards.find(c => c.id === id))
      .filter(Boolean);

    if (!walletCards.length) {
      await showWalletSummary(walletIds, cardData);
      return;
    }

    const ranked = getBestCards(walletCards, merchant.cardCategory);
    renderMerchantView({ merchant, ranked }, walletIds, cardData);

  } catch (err) {
    console.error("[Rewardly] popup error:", err);
    const errEl = document.getElementById("stateError");
    if (errEl) {
      errEl.querySelector("#errorMsg").textContent = err.message || "Unknown error";
      showState("stateError");
    } else {
      showState("stateNoMerchant");
    }
  }
}

function renderMerchantView({ merchant, ranked }, walletIds, cardData) {
  showState("stateMerchant");

  document.getElementById("merchantIcon").textContent = CATEGORY_ICONS[merchant.cardCategory] || "🛍️";
  document.getElementById("merchantName").textContent = merchant.name;
  document.getElementById("merchantCategory").textContent = merchant.displayCategory;

  const best = ranked[0];
  document.getElementById("bestCardIssuer").textContent = best.card.issuer;
  document.getElementById("bestCardName").textContent = best.card.name;
  document.getElementById("bestCardRate").textContent = formatRateShort(best.rate);
  const labelEl = document.getElementById("bestCardLabel");
  if (labelEl) labelEl.textContent = best.rate.label;

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

  // Upgrade hint (async, non-blocking)
  checkUpgrade(merchant, ranked, walletIds, cardData).catch(() => {});
}

async function checkUpgrade(merchant, ranked, walletIds, cardData) {
  const nonWallet = cardData.cards.filter(c => c.country === "CA" && !walletIds.includes(c.id));
  const bestInWallet = ranked[0]?.rate?.percent || 0;

  const best = nonWallet
    .map(card => {
      const cr = card.categoryRewards?.find(r => r.category === merchant.cardCategory);
      const rate = cr ? cr.rewardRate : card.baseRewardRate;
      const pct = rate.type === "cashback"
        ? rate.value
        : parseFloat(((rate.value * (card.pointValuation || 1)) / 100).toFixed(2));
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
}

async function showWalletSummary(walletIds, cardData) {
  showState("stateNoMerchant");
  const walletList = document.getElementById("walletList");
  walletList.innerHTML = "";

  if (!walletIds.length) {
    walletList.innerHTML = `<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:8px 0">No cards added yet.</p>`;
    return;
  }

  try {
    const data = cardData || await fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json());
    walletIds.slice(0, 5).forEach(id => {
      const card = data.cards.find(c => c.id === id);
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
