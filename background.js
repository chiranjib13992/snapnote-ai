chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CAPTURE_SCREENSHOT") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (imageUri) => {
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshots/capture_${timestamp}.png`;

      chrome.downloads.download({
        url: imageUri,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        console.log("Image saved with ID:", downloadId);
        sendResponse({ image: imageUri, status: "saved" });
      });
    });
    return true;
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "SAVE_SUMMARY") {
    const blob = new Blob([request.summary], { type: 'text/plain' });
    const reader = new FileReader();
    
    reader.onloadend = function() {
      const base64data = reader.result;
      chrome.downloads.download({
        url: base64data,
        filename: `summarize/summary_${Date.now()}.txt`,
        saveAs: false
      });
    };
    reader.readAsDataURL(blob);
  }
});
