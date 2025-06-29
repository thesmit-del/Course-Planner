document.addEventListener("DOMContentLoaded", () => {
    const scanEmailBtn = document.getElementById("scanEmail");
    const scanExtraBtn = document.getElementById("scanExtra");
    const resultsDiv = document.getElementById("results");

    scanEmailBtn.addEventListener("click", () => {
        resultsDiv.style.display = "block";
        scanEmailBtn.style.display = "none";
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

        links.forEach(link => {
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
                body: JSON.stringify({ url: link.href })
            })
                .then(response => response.json())
                .then(data => {
                    const isMalicious =
                        data.is_https === false ||
                        data.is_ssl_valid === false ||
                        (data.stats && (data.stats.malicious > 0 || data.stats.suspicious > 0));

                    resultSpan.textContent = isMalicious ? " ⚠️ Risky" : " ✅ Safe";

                    if (isMalicious) {
                        resultSpan.style.cursor = "pointer";

                        const hoverBox = document.createElement("div");
                        hoverBox.className = "hover-popup";
                        hoverBox.textContent = JSON.stringify(data, null, 2);
                        wrapper.appendChild(resultSpan);
                        wrapper.appendChild(hoverBox);

                        resultSpan.addEventListener("mouseenter", (e) => {
                            hoverBox.style.display = "block";
                            hoverBox.style.top = e.clientY + 10 + "px";
                            hoverBox.style.left = e.clientX + 10 + "px";
                        });

                        resultSpan.addEventListener("mouseleave", () => {
                            setTimeout(() => {
                                if (!hoverBox.matches(':hover')) {
                                    hoverBox.style.display = "none";
                                }
                            }, 150);
                        });

                        hoverBox.addEventListener("mouseleave", () => {
                            hoverBox.style.display = "none";
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
