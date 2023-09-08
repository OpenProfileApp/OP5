const body = document.body;
const bodyContext = document.getElementById("bodyContext");
const versionOption = document.getElementById("version");
const languageOption = document.getElementById("languageOption");
const languageSubMenu = document.getElementById("languageSubMenu");
const packElement = document.getElementById("pack");

let isLanguageSubMenuOpen = false;
let hideSubMenuTimeout;

// Prevent the context menu from opening on the body element
body.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

document.addEventListener("contextmenu", (e) => {
  // Check if the right-click occurred on the #pack element
  if (e.target === packElement) {
    return; // Don't execute the script if right-clicking on #pack
  }

  e.preventDefault();
  bodyContext.style.left = `${e.clientX}px`;
  bodyContext.style.top = `${e.clientY}px`;
  bodyContext.classList.add("show");
  contextMenu.classList.remove("show");

  if (isLanguageSubMenuOpen) {
    // If languageSubMenu is open, position it to the right of the mouse cursor
    positionSubMenu(e.clientX, e.clientY);
  }
});

versionOption.addEventListener("click", () => {
  console.log("Version clicked");
  // Add code to handle the versionOption click here
  closeContextMenu();
});

languageOption.addEventListener("mouseenter", () => {
  // Show the languageSubMenu on hover to the right of the languageOption
  positionSubMenu();
  languageSubMenu.classList.remove("hidden");
  isLanguageSubMenuOpen = true;
});

// Delay hiding the languageSubMenu when the mouse leaves both languageOption and languageSubMenu
languageOption.addEventListener("mouseleave", () => {
  clearTimeout(hideSubMenuTimeout);
  hideSubMenuTimeout = setTimeout(() => {
    hideLanguageSubMenu();
  }, 0); // Adjust the delay as needed
});

// Keep the submenu open when hovering over it
languageSubMenu.addEventListener("mouseenter", () => {
  clearTimeout(hideSubMenuTimeout); // Cancel the delayed hide
  isLanguageSubMenuOpen = true;
});

// Hide the languageSubMenu when the mouse leaves it
languageSubMenu.addEventListener("mouseleave", () => {
  hideSubMenuTimeout = setTimeout(() => {
    hideLanguageSubMenu();
  }, 0); // Adjust the delay as needed
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeContextMenu();
  }
});

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target) && !bodyContext.contains(e.target)) {
    closeContextMenu();
  }
});

// Helper function to close the context menu
function closeContextMenu() {
  contextMenu.classList.remove("show");
  bodyContext.classList.remove("show");
}

// Helper function to hide the languageSubMenu
function hideLanguageSubMenu() {
  languageSubMenu.classList.add("hidden");
  isLanguageSubMenuOpen = false;
}

// Helper function to position the submenu to the right of the main menu
function positionSubMenu(mouseX, mouseY) {
  // Offset values to position the submenu to the right of the mouse cursor
  const offsetLeft = 10; // Adjust this value as needed
  const offsetTop = 100; // Adjust this value as needed

  languageSubMenu.style.left = `${mouseX + offsetLeft}px`;
  languageSubMenu.style.top = `${mouseY + offsetTop}px`;
  languageSubMenu.style.width = "auto"; // Reset the width to "auto" to fit content
}
