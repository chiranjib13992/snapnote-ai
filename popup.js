document.getElementById("captureBtn").onclick = () => {
  chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" }, (res) => {
    if (res && res.image) {
      document.getElementById("preview").src = res.image;
      console.log("Screenshot captured and saved to folder!");
    }
  });
};

const analysisBtn = document.getElementById("analysisBtn");
const previewImg = document.getElementById("preview");
const noteArea = document.getElementById("note");
const saveBtn = document.getElementById("saveBtn");
saveBtn.style.display = "none";
const keyboardBtn = document.getElementById("keyboardBtn");

analysisBtn.onclick = async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("https://chrome.google.com")
    ) {
      alert("Cannot capture this page.");
      return;
    }

    // 1️⃣ Capture screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "jpeg",
      quality: 90
    });

    previewImg.src = dataUrl;

    const blob = await (await fetch(dataUrl)).blob();

    const formData = new FormData();
    formData.append("image", blob, "screenshot.jpg");

    noteArea.value = "Analyzing screenshot...";
    analysisBtn.innerText = "Analyzing...";


    const res = await fetch("http://localhost:3000/analyze/image-prossing", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("API request failed");
    }
    analysisBtn.style.display = "none";
    saveBtn.style.display = "block";

    const data = await res.json();
    noteArea.value = data.result || "No analysis returned.";

  } catch (err) {
    console.error("Analysis error:", err);
    noteArea.value = "❌ Failed to analyze screenshot.";
  }
};

saveBtn.onclick = () => {
  const content = noteArea.value;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const filename = `screenshots/analysis_${Date.now()}.txt`;
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

function renderShortcuts(categories) {
  const panel = document.getElementById("shortcutPanel");
  panel.innerHTML = "";
  panel.classList.remove("hidden");

  // ❌ Close button
  const closeBtn = document.createElement("span");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "&times;"; // ×
  closeBtn.title = "Close";
  closeBtn.onclick = () => {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  };
  panel.appendChild(closeBtn);

  Object.entries(categories).forEach(([categoryName, shortcuts]) => {
    const title = document.createElement("div");
    title.className = "shortcut-category";
    title.textContent = categoryName.toUpperCase();
    panel.appendChild(title);

    shortcuts.forEach(sc => {
      const item = document.createElement("div");
      item.className = "shortcut-item";

      item.innerHTML = `
        <i class="fa fa-keyboard-o"></i>
        <kbd>${sc.keys}</kbd>
        <span>${sc.action}</span>
      `;

      panel.appendChild(item);
    });
  });
}

document.getElementById("keyboardBtn").addEventListener("click", () => {
  document.getElementById("note").focus();

  if (!navigator.userAgentData) return;

  navigator.userAgentData
    .getHighEntropyValues(["platform"])
    .then(data => {
      const os = data.platform.toLowerCase(); // windows / macos

      fetch(`http://localhost:3000/analyze/keyboard-shortcuts/${os}`)
        .then(res => res.json())
        .then(resP => {
          if (!resP.success) return;

          renderShortcuts(resP.data.categories);
        });
    });
});