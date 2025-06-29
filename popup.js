// Wait for the popup's DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
	// Get the <ul> element where we will show the links
	const list = document.getElementById("linkList");

	// Retrieve the stored email links from Chrome's local storage
	chrome.storage.local.get("emailLinks", (result) => {
		// If there are no links, use an empty array (to avoid crashing)
		const links = result.emailLinks || [];

		// Loop over each link (object with href and text)
		links.forEach(link => {
			// Create a new list item (<li>)
			const li = document.createElement("li");
			// Create an anchor (<a>) element
			const a = document.createElement("a");

			a.href = link.href; // Set the URL for the anchor
			a.textContent = `${link.text}`; // Use the link's label 
			a.target = "_blank"; // Open the link in a new tab when clicked
			li.appendChild(a); // Add the anchor to the list item

			// Create a <span> to display the result of the safety check
			const resultSpan = document.createElement("span");
			resultSpan.textContent = " (Checking...)"; // Initial status while waiting for backend response
			li.appendChild(resultSpan); // Add the span to the list item
			list.appendChild(li); // Add the list item to the list in the popup

			// Send the link to the Flask backend for analysis
			fetch("http://localhost:5000/geturl", {
				method: "POST", // Use POST request
				headers: { "Content-Type": "application/json" }, // Tell backend to expect JSON
				body: JSON.stringify({ url: link.href }) // Send the link URL as JSON
			})
				// Get the backend's response and turn it into JSON so JavaScript can use it
				.then(response => response.json())
				.then(data => {
					// Determine if the link is risky based on backend's analysis
					// - Not HTTPS, or SSL invalid, or flagged as malicious/suspicious
					const isMalicious =
						data.is_https === false ||
						data.is_ssl_valid === false ||
						(data.stats && (data.stats.malicious > 0 || data.stats.suspicious > 0));

					// Create a wrapper to hold the emoji and the floating box
					const wrapper = document.createElement("div");
					wrapper.style.position = "relative"; // needed for absolute hover box positioning
					wrapper.style.display = "inline-block"; // keeps emoji in place

					// Create result emoji
					resultSpan.textContent = isMalicious ? " ⚠️ Risky" : " ✅ Safe";

					// Only for risky ones
					if (isMalicious) {
						resultSpan.style.cursor = "pointer";

						// Create the floating hover box
						const hoverBox = document.createElement("div");
						hoverBox.className = "hover-popup";
						hoverBox.textContent = JSON.stringify(data, null, 2);
						hoverBox.style.display = "none";

						li.appendChild(hoverBox);

						// Show popup on hover
						resultSpan.addEventListener("mouseenter", () => {
							hoverBox.style.display = "block";
						});

						// Hide only when mouse leaves both emoji and popup
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

						wrapper.appendChild(resultSpan);
						wrapper.appendChild(hoverBox);
					} else {
						wrapper.appendChild(resultSpan);
					}

					li.appendChild(wrapper);
				})
				// If there was an error (network, backend, or parsing), show an error status
				.catch(() => {
					resultSpan.textContent = " ❌ Error";
				});
		});
	});
});
