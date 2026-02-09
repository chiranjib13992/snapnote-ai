chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PAGE_TEXT") {
    const text = document.body.innerText.replace(/\s+/g, ' ').trim();
    
    if (text.length > 0) {
      sendResponse({ text: text });
    } else {
      sendResponse({ text: null });
    }
  }
  return true;
});