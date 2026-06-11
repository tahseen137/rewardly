(function () {
  const hostname = window.location.hostname;
  chrome.runtime.sendMessage({ type: "PAGE_VISIT", hostname }, (response) => {
    if (chrome.runtime.lastError) {
      // Background worker not ready yet — silently ignore
    }
  });
})();
