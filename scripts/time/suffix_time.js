document.addEventListener('DOMContentLoaded', function() {
  const textInput = document.getElementById('suffix');
  const writtenDateInput = document.getElementById('written_date');
  const lastModified = document.getElementById('suffix_time');
  const targetElement = document.getElementById('suffix'); // Change 'target_element' to the actual ID of the element you want to modify
  const consoleLog = document.getElementById('console_log');
  const currentDate = new Date();
  let previousInputValueOld = '';
  let previousInputValueNew = '';
  let isTextInputFocused = false;

  textInput.addEventListener('input', updateLastModified);
  textInput.addEventListener('focus', () => isTextInputFocused = true);
  textInput.addEventListener('blur', () => {
    isTextInputFocused = false;
    updateInput();
  });

  function updateLastModified() {
    const enteredText = textInput.value;
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: 'numeric',
    });

    const loggedDate = new Date(writtenDateInput.value);
    const isLoggedDateEqualToLocal = isDateEqualToLocal(loggedDate);

    if (!isLoggedDateEqualToLocal && enteredText !== previousInputValueOld) {
      lastModified.textContent = `Last modified: ${formattedDate}`;
      previousInputValueNew = enteredText; // Update the new value
      targetElement.style.borderRadius = '0px 5px 0px 5px'; // Modify the border radius as needed
    } else {
      lastModified.textContent = '';
      targetElement.style.borderRadius = '0px 5px 5px 5px'; // Reset the border radius
    }

    updateConsoleLog(enteredText);
  }

  function isDateEqualToLocal(date) {
    const formattedLoggedDates = [
      date.toLocaleDateString('en-US'),
      `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
      `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
    ];

    return formattedLoggedDates.some(format => format === currentDate.toLocaleDateString('en-US'));
  }
  
  function updateInput() {
    if (!isTextInputFocused) {
      const loggedDate = new Date(writtenDateInput.value);
      const isLoggedDateEqualToLocal = isDateEqualToLocal(loggedDate);

      if (isLoggedDateEqualToLocal) {
        previousInputValueOld = textInput.value;
      }
    }
  }

  function updateConsoleLog(enteredText) {
    consoleLog.textContent = `Entered Text: ${enteredText}\nPrevious Input Old: ${previousInputValueOld}\nPrevious Input New: ${previousInputValueNew}`;
  }
});