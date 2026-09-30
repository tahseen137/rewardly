// Rewardly — Onboarding / Wallet Setup

let allCards = [];
let selectedIds = new Set();

async function init() {
  const data = await fetch(chrome.runtime.getURL("data/cards.json")).then(r => r.json());
  allCards = data.cards.filter(c => c.country === "CA");

  // Load existing wallet
  const { walletIds = [] } = await chrome.storage.local.get({ walletIds: [] });
  walletIds.forEach(id => selectedIds.add(id));

  render(allCards);
  updateCount();

  document.getElementById("searchInput").addEventListener("input", e => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q
      ? allCards.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.issuer.toLowerCase().includes(q) ||
          (c.rewardProgram || "").toLowerCase().includes(q)
        )
      : allCards;
    render(filtered);
  });

  document.getElementById("saveBtn").addEventListener("click", saveWallet);
}

function groupByIssuer(cards) {
  const groups = {};
  cards.forEach(card => {
    if (!groups[card.issuer]) groups[card.issuer] = [];
    groups[card.issuer].push(card);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function render(cards) {
  const container = document.getElementById("cardList");
  container.innerHTML = "";

  if (!cards.length) {
    container.innerHTML = `<div class="no-results">No cards match your search.</div>`;
    return;
  }

  const groups = groupByIssuer(cards);
  groups.forEach(([issuer, issuerCards]) => {
    const group = document.createElement("div");
    group.className = "issuer-group";

    const label = document.createElement("div");
    label.className = "issuer-name";
    label.textContent = issuer;
    group.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "card-grid";

    issuerCards.forEach(card => {
      const item = document.createElement("div");
      item.className = `card-item${selectedIds.has(card.id) ? " selected" : ""}`;
      item.dataset.id = card.id;

      const feeLabel = card.annualFee === 0
        ? "No annual fee"
        : `$${card.annualFee.toFixed(0)}/yr`;

      item.innerHTML = `
        <div class="card-check">${selectedIds.has(card.id) ? "✓" : ""}</div>
        <div class="card-details">
          <div class="card-name">${card.name}</div>
          <div class="card-meta">${card.rewardProgram || "Rewards"} · <span class="card-annual">${feeLabel}</span></div>
        </div>
      `;

      item.addEventListener("click", () => toggleCard(card.id, item));
      grid.appendChild(item);
    });

    group.appendChild(grid);
    container.appendChild(group);
  });
}

function toggleCard(id, el) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
    el.classList.remove("selected");
    el.querySelector(".card-check").textContent = "";
  } else {
    selectedIds.add(id);
    el.classList.add("selected");
    el.querySelector(".card-check").textContent = "✓";
  }
  updateCount();
}

function updateCount() {
  const n = selectedIds.size;
  document.getElementById("selectedCount").textContent = n;
  document.getElementById("saveBtn").disabled = n === 0;
  document.getElementById("footerHint").textContent =
    n === 0 ? "Select at least one card to continue." :
    n === 1 ? "1 card selected." :
    `${n} cards selected.`;
}

async function saveWallet() {
  const walletIds = [...selectedIds];
  await chrome.storage.local.set({ walletIds });
  // Close tab — user returns to whatever they were doing
  window.close();
}

document.addEventListener("DOMContentLoaded", init);
