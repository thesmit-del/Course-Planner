// Extracts all hyperlinks from the open Gmail email and stores them in Chrome's local storage.

// Function to scrape all links from the currently open Gmail email and store them
function scrapeAndStoreLinks() {
  // Gmail email body container (class 'a3s' is used by Gmail for email content)
  const emailBody = document.querySelector(".a3s");
  const links = [];

  // If no email body is found, exit early
  if (!emailBody) return;

  // Find all anchor tags (links) within the email body
  const anchors = emailBody.querySelectorAll("a");

  anchors.forEach(a => {
    const href = a.href;
    let label = a.innerText.trim();

    // If the link has no visible text, try to use its title or alt attribute, or fallback to 'No Label'
    if (!label) {
      label = a.getAttribute("title") || a.getAttribute("alt") || "No Label";
    }

    // Only include valid http links
    if (href && href.startsWith("http")) {
      links.push({ href, text: label });
    }
  });

  // Remove any previously stored links, then save the new set to Chrome's local storage
  chrome.storage.local.remove("emailLinks", () => {
    chrome.storage.local.set({ emailLinks: links }, () => {
      console.log("✅ Saved tagged links:", links);
    });
  });
}

// Set up a MutationObserver to watch for changes in the Gmail UI (e.g., when a new email is opened)
const targetNode = document.querySelector("body");

const observer = new MutationObserver((mutationsList, observer) => {
  // When the DOM changes, check if a new email body is present
  const emailBody = document.querySelector(".a3s");
  if (emailBody) {
    // Wait a short time to ensure Gmail has finished rendering the email
    setTimeout(scrapeAndStoreLinks, 500);
  }
});

// Start observing the body for changes to child elements and all descendants
observer.observe(targetNode, {
  childList: true,
  subtree: true
});
