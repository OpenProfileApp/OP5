// Function to show the modal dialog on page load
function showTextPopup() {
    const modal = document.getElementById('popup_0');
    modal.style.display = 'block';
  
    // Close the modal on left-click
    modal.addEventListener('click', () => {
      // Create a container for confetti
      const confettiContainer = document.createElement('div');
      confettiContainer.classList.add('confetti-container');
  
      // Create and append confetti elements to the container
      for (let i = 0; i < 100; i++) { // You can adjust the number of confetti pieces
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confettiContainer.appendChild(confetti);
  
        // Randomize confetti animation properties
        const angle = Math.random() * 360;
        const distance = Math.random() * 100;
        const rotation = Math.random() * 360;
  
        confetti.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        confetti.style.left = `${50 + distance * Math.cos(angle)}%`;
        confetti.style.top = `${50 + distance * Math.sin(angle)}%`;
      }
  
      // Append the confetti container to the modal
      modal.appendChild(confettiContainer);
  
      // Hide the modal
      setTimeout(() => {
        setTimeout(() => {
          modal.style.display = 'none';
        }, 500);
        modal.style.opacity = '0';
      }, 500);
  
      // Remove the confetti container after a delay (adjust the delay as needed)
      setTimeout(() => {
        confettiContainer.remove();
      }, 5000); // 5 seconds delay for confetti removal
    });
  }
  
  // Trigger the modal on page load
  showTextPopup();
  