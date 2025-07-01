document.addEventListener("DOMContentLoaded", () => {
    const scanEmailBtn = document.getElementById("scanEmail");
    const scanExtraBtn = document.getElementById("scanExtra");
    const resultsDiv = document.getElementById("results");

    scanEmailBtn.addEventListener("click", () => {
        resultsDiv.style.display = "block";
        scanEmailBtn.style.display = "none";
        document
            .getElementById("buttonContainer")
            .classList.add("results-visible");
        runEmailScan();
    });

    scanExtraBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: "http://localhost:3000" });
    });
});

function runEmailScan() {
    const list = document.getElementById("linkList");

    chrome.storage.local.get("emailLinks", (result) => {
        const links = result.emailLinks || [];

        links.forEach((link) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = link.href;
            a.textContent = link.text;
            a.target = "_blank";
            li.appendChild(a);

            const resultSpan = document.createElement("span");
            resultSpan.textContent = " (Checking...)";
            li.appendChild(resultSpan);

            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";

            fetch("http://localhost:5000/geturl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: link.href }),
                credentials: "omit"
            })
                .then((response) => response.json())
                .then((data) => {
                    const isMalicious =
                        data.is_https === false ||
                        data.is_ssl_valid === false ||
                        (data.stats &&
                            (data.stats.malicious > 0 ||
                                data.stats.suspicious > 0));

                    resultSpan.textContent = isMalicious
                        ? " ⚠️ Risky"
                        : " ✅ Safe";

                    if (isMalicious) {
                        resultSpan.style.cursor = "pointer";

                        const hoverBox = document.createElement("div");
                        hoverBox.classList.add("hover-popup", "popup-hidden");
                        hoverBox.className = "hover-popup";
                        // hoverBox.textContent = JSON.stringify(data, null, 2);
                        hoverBox.innerHTML = `
  <div class="popup-header">Scan Results</div>
  <div class="popup-row"><strong>URL:</strong> ${data.url}</div>
  <div class="popup-row"><strong>HTTPS:</strong> ${
      data.is_https ? "Yes" : "No"
  }</div>
  <div class="popup-row"><strong>SSL Valid:</strong> ${
      data.is_ssl_valid ? "Yes" : "No"
  }</div>
  <div class="popup-stats">
    <div><strong>Harmless:</strong> ${data.stats?.harmless ?? 0}</div>
    <div><strong>Suspicious:</strong> ${data.stats?.suspicious ?? 0}</div>
    <div><strong>Malicious:</strong> ${data.stats?.malicious ?? 0}</div>
    <!-- add any fields you want -->
  </div>
`;
                        wrapper.appendChild(resultSpan);
                        wrapper.appendChild(hoverBox);

                        resultSpan.addEventListener("mouseenter", (e) => {
                            hoverBox.classList.remove("popup-hidden");
                            hoverBox.classList.add("popup-visible");
                        });

                        resultSpan.addEventListener("mouseleave", () => {
                            setTimeout(() => {
                                if (!hoverBox.matches(":hover")) {
                                    hoverBox.classList.remove("popup-visible");
                                    hoverBox.classList.add("popup-hidden");
                                }
                            }, 150);
                        });

                        hoverBox.addEventListener("mouseleave", () => {
                            hoverBox.classList.remove("popup-visible");
                            hoverBox.classList.add("popup-hidden");
                        });
                    } else {
                        wrapper.appendChild(resultSpan);
                    }

                    li.appendChild(wrapper);
                })
                .catch(() => {
                    resultSpan.textContent = " ❌ Error";
                });

            list.appendChild(li);
        });
    });
}
