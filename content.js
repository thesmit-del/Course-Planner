// Scrape links from Gmail emails and store them in Chrome storage

function scrapeAndStoreLinks() {
	// find the main content area of the email, Gmail uses a .a3s class for the actual message
	const emailBody = document.querySelector(".a3s");
	const links = [];

	// If no email body is found, exit
	if (!emailBody) return;

	// Find all <a> tags (links) inside the email body 
	const anchors = emailBody.querySelectorAll("a");

	// For each link (a) we found
	anchors.forEach(a => {
		const href = a.href; // the actual URL
		let label = a.innerText.trim(); 

		// If the link has no visible text, try to use its title or alt attribute, else use 'No Label'
		if (!label) {
			label = a.getAttribute("title") || a.getAttribute("alt") || "No Label";
		}

		// Only include valid http links
		if (href && href.startsWith("http")) {
			links.push({ href, text: label });
		}
	});

	// Remove old saved links, then save the new ones to Chrome's local storage
	chrome.storage.local.remove("emailLinks", () => {
		chrome.storage.local.set({ emailLinks: links }, () => {
			console.log("✅ Saved tagged links:", links);
		});
	});
}

// Watch for changes in the entire Gmail page (e.g., when a new email is opened)
const targetNode = document.querySelector("body");

// MutationObserver automatically calls the above function when Gmail changes the page
const observer = new MutationObserver((mutationsList, observer) => {
	// When the DOM changes, check for a new email body
	const emailBody = document.querySelector(".a3s");
	if (emailBody) {
		// Wait for 0.5s to ensure Gmail has finished rendering the email, then recall the function
		setTimeout(scrapeAndStoreLinks, 500);
	}
});

// we tell the observer to start observing the targetNode for changes to child elements and all descendants
observer.observe(targetNode, {
	childList: true,
	subtree: true 
});
