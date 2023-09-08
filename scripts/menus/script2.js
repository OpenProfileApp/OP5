const packElement = document.getElementById("pack");
const contextMenu = document.getElementById("contextMenu");
const versionOption = document.getElementById("version");
const textBox = document.querySelector('input[type="first_name"]');
const disablePackOption = document.getElementById("disablePackOption");
const isLockedButton = document.getElementById("isLocked");

let isLocked = false;

packElement.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.classList.add("show");
  bodyContext.classList.remove("show");
});

disablePackOption.addEventListener("click", () => {
  if (isLocked) {
    // If locked, set a different text on the isLockedButton
    isLockedButton.textContent = "🔒 Lock Textbox";
  }
  packElement.style.display = "none"; // Hide the pack element
  closeContextMenu();
});

versionOption.addEventListener("click", () => {
  console.log("Version clicked");
  // Add code to handle the versionOption click here
  closeContextMenu();
});

isLockedButton.addEventListener("click", () => {
  isLocked = !isLocked;
  if (isLocked) {
    textBox.disabled = true;
    isLockedButton.textContent = "🔓 Unlock Textbox"; // Change button text
    textBox.addEventListener("input", preventInput);
  } else {
    textBox.disabled = false;
    isLockedButton.textContent = "🔒 Lock Textbox"; // Change button text
    textBox.removeEventListener("input", preventInput);
  }

  closeContextMenu();
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

function preventInput(e) {
  e.preventDefault();
}
