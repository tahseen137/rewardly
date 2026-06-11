(function () {
  const hostname = window.location.hostname;
  console.log("[Rewardly] Content script loaded on:", hostname);
  chrome.runtime.sendMessage({ type: "PAGE_VISIT", hostname }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[Rewardly] sendMessage error:", chrome.runtime.lastError.message);
    } else {
      console.log("[Rewardly] Background acknowledged PAGE_VISIT:", response);
    }
  });
})();
