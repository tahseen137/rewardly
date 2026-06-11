(function () {
  const hostname = window.location.hostname;
  chrome.runtime.sendMessage({ type: "PAGE_VISIT", hostname });
})();
