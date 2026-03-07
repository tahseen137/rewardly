/**
 * Rewardly Chrome Extension — Popup Script
 * Detects the current merchant, fetches cashback rates, renders polished UI
 */

// Program metadata (logos + labels)
const PROGRAMS = {
  Rakuten: { emoji: "🟠", label: "Rakuten Canada", color: "#FF0000" },
  GCR: { emoji: "🍁", label: "Great Canadian Rebates", color: "#D32F2F" },
  TopCashback: { emoji: "💰", label: "TopCashback", color: "#00BF6F" },
  Honey: { emoji: "🍯", label: "PayPal Honey", color: "#F7B731" },
};

// Category icons
const CATEGORY_ICONS = {
  General: "🛍️",
  Electronics: "💻",
  Beauty: "💄",
  Books: "📚",
  Sports: "⚽",
  Fashion: "👗",
  Grocery: "🛒",
  "Department Store": "🏬",
};

// State elements
const loadingState = document.getElementById("loadingState");
const notFoundState = document.getElementById("notFoundState");
const resultsState = document.getElementById("resultsState");

function showState(state) {
  loadingState.classList.add("hidden");
  notFoundState.classList.add("hidden");
  resultsState.classList.add("hidden");
  state.classList.remove("hidden");
}

/**
 * Match current domain against merchant database
 */
function findMerchant(hostname, merchants) {
  // Normalize: remove www. prefix
  const clean = hostname.replace(/^www\./, "");
  
  return merchants.find((m) => {
    return m.urlPatterns.some((pattern) => {
      return clean === pattern || clean.endsWith("." + pattern) || clean.includes(pattern);
    });
  });
}

/**
 * Sort rates best-first (highest % first)
 */
function sortRates(rates) {
  return [...rates].sort((a, b) => b.rate - a.rate);
}

/**
 * Render rate rows
 */
function renderRates(rates, container) {
  const sorted = sortRates(rates);
  container.innerHTML = "";

  sorted.forEach((rate, idx) => {
    const program = PROGRAMS[rate.program] || { emoji: "💳", label: rate.program };
    const row = document.createElement("div");
    const rankNum = idx + 1;
    const isBest = idx === 0;

    row.className = `rate-row${isBest ? " best" : ""}`;

    // Rank badge
    const rankClass = rankNum <= 3 ? `rank-${rankNum}` : "rank-other";
    
    row.innerHTML = `
      <div class="rate-rank ${rankClass}">${rankNum}</div>
      <span class="program-logo" title="${program.label}">${program.emoji}</span>
      <div class="program-info">
        <div class="program-name">${program.label}</div>
        ${isBest ? '<div class="program-label">Best rate ✓</div>' : ""}
      </div>
      <span class="rate-amount">${rate.rate}%</span>
      <a href="${rate.url}" target="_blank" class="activate-btn ${isBest ? "primary" : "secondary"}">
        ${isBest ? "Activate" : "Use"}
      </a>
    `;

    container.appendChild(row);
  });
}

/**
 * Main: get current tab URL, find merchant, render
 */
async function main() {
  showState(loadingState);

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      showState(notFoundState);
      return;
    }

    const url = new URL(tab.url);
    const hostname = url.hostname;

    // Load merchant data
    const response = await fetch(chrome.runtime.getURL("data/merchants.json"));
    const data = await response.json();
    const merchants = data.merchants;

    // Find matching merchant
    const merchant = findMerchant(hostname, merchants);

    if (!merchant) {
      showState(notFoundState);
      return;
    }

    // Populate UI
    const sorted = sortRates(merchant.rates);
    const bestRate = sorted[0];

    document.getElementById("merchantName").textContent = merchant.name;
    document.getElementById("merchantCategory").textContent = merchant.category;
    document.getElementById("merchantIcon").textContent =
      CATEGORY_ICONS[merchant.category] || "🛍️";
    document.getElementById("bestRate").textContent = `${bestRate.rate}%`;

    // Estimate savings on $100
    const saving = ((100 * bestRate.rate) / 100).toFixed(2);
    document.getElementById("estimateAmount").textContent = `$${saving}`;

    // Render rates list
    const ratesList = document.getElementById("ratesList");
    renderRates(merchant.rates, ratesList);

    showState(resultsState);
  } catch (err) {
    console.error("Rewardly popup error:", err);
    showState(notFoundState);
  }
}

// Settings button
document.getElementById("openSettings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Run on load
document.addEventListener("DOMContentLoaded", main);
