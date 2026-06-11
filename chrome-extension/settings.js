// Rewardly Chrome Extension — Settings Page

const DEFAULTS = {
  showBadge: true,
  showNotifications: true,
  minRate: 0,
  sortOrder: "best-first",
  showEstimate: true,
};

// Load saved settings on page open
chrome.storage.local.get(DEFAULTS, (settings) => {
  if (chrome.runtime.lastError) {
    console.error("Rewardly: failed to load settings", chrome.runtime.lastError);
    return;
  }
  document.getElementById("showBadge").checked = settings.showBadge;
  document.getElementById("showNotifications").checked = settings.showNotifications;
  document.getElementById("minRate").value = settings.minRate;
  document.getElementById("sortOrder").value = settings.sortOrder;
  document.getElementById("showEstimate").checked = settings.showEstimate;
});

// Save settings
document.getElementById("saveBtn").addEventListener("click", () => {
  const settings = {
    showBadge: document.getElementById("showBadge").checked,
    showNotifications: document.getElementById("showNotifications").checked,
    minRate: parseInt(document.getElementById("minRate").value, 10),
    sortOrder: document.getElementById("sortOrder").value,
    showEstimate: document.getElementById("showEstimate").checked,
  };

  chrome.storage.local.set(settings, () => {
    const confirmEl = document.getElementById("saveConfirm");
    if (chrome.runtime.lastError) {
      confirmEl.style.color = "#EF4444";
      confirmEl.textContent = "✗ Save failed — " + chrome.runtime.lastError.message;
    } else {
      confirmEl.style.color = "#10B981";
      confirmEl.textContent = "✓ Settings saved";
    }
    setTimeout(() => {
      confirmEl.textContent = "";
    }, 2500);
  });
});
