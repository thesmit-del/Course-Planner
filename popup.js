// Script for the popup window that displays scraped email links

document.addEventListener("DOMContentLoaded", () => {
  // Retrieve the stored email links from Chrome's local storage
  chrome.storage.local.get("emailLinks", (result) => {
    const links = result.emailLinks || [];
    const list = document.getElementById("linkList");

    // For each link, create a list item with a clickable anchor
    links.forEach(linkObj => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      a.href = linkObj.href; // Set the link URL
      a.textContent = `${linkObj.text || "[No Label]"}`; // Set the link label or fallback
      a.target = "_blank"; // Open link in a new tab

      li.appendChild(a); // Add anchor to list item
      list.appendChild(li); // Add list item to the list
    });
  });
});
