// This script runs in the popup window of the Chrome extension.
// It retrieves scraped email links from Chrome's local storage, displays them in a list,
// and checks each link's safety by sending it to a Flask backend for analysis.

// Wait for the popup's DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
	// Get the <ul> element where we show the links
	const list = document.getElementById("linkList");

	// Retrieve the stored email links from Chrome's local storage
	chrome.storage.local.get("emailLinks", (result) => {
		// If there are no links, use an empty array
		const links = result.emailLinks || [];

		// Loop through each link object retrieved from storage
		links.forEach(link => {
			// Create a new list item (<li>) for each link
			const li = document.createElement("li");
			// Create an anchor (<a>) element for the clickable link
			const a = document.createElement("a");
			a.href = link.href; // Set the URL for the anchor
			a.textContent = `${link.text || "[No Label]"}`; // Use the link's label or a fallback if missing
			a.target = "_blank"; // Open the link in a new tab when clicked
			li.appendChild(a); // Add the anchor to the list item

			// Create a <span> to display the result of the safety check
			const resultSpan = document.createElement("span");
			resultSpan.textContent = " (Checking...)"; // Initial status while waiting for backend response
			li.appendChild(resultSpan); // Add the span to the list item
			list.appendChild(li); // Add the list item to the list in the popup

			// Send the link to the Flask backend for safety analysis
			fetch("http://localhost:5000/geturl", {
				method: "POST", // Use POST to send data
				headers: { "Content-Type": "application/json" }, // Tell backend to expect JSON
				body: JSON.stringify({ url: link.href }) // Send the link URL as JSON
			})
				// Parse the backend's response as JSON
				.then(response => response.json())
				.then(data => {
					// Determine if the link is risky based on backend's analysis
					// - Not HTTPS, or SSL invalid, or flagged as malicious/suspicious
					const isMalicious =
						data.is_https === false ||
						data.is_ssl_valid === false ||
						(data.stats && (data.stats.malicious > 0 || data.stats.suspicious > 0));

					// Update the result span with the safety status
					resultSpan.textContent = isMalicious ? " ⚠️ Risky" : " ✅ Safe";
				})
				// If there was an error (network, backend, or parsing), show an error status
				.catch(() => {
					resultSpan.textContent = " ❌ Error";
				});
		});
	});
});
