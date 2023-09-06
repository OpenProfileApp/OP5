// Function to save data to a .op5 file
function saveData() {
  const suggestedFilename = "";
  const filename = prompt("What is the OC's name? (this will be the save file name):", suggestedFilename);

  if (filename === null) {
    return;
  }

  // Validate the filename extension
  const validatedFilename = filename.toLowerCase().endsWith('.op5') ? filename : filename + '.op5';

  const data = {
    pageAuthor: document.getElementById("page_author").value,
    writtenDate: document.getElementById("written_date").value,
    fullName: document.getElementById("full_name").value,
    fullNameTime: document.getElementById("full_name_time").textContent,
    firstName: document.getElementById("first_name").value,
    firstNameTime: document.getElementById("first_name_time").textContent,
    middleName: document.getElementById("middle_name").value,
    middleNameTime: document.getElementById("middle_name_time").textContent,
    lastName: document.getElementById("last_name").value,
    lastNameTime: document.getElementById("last_name_time").textContent,
    nickname: document.getElementById("nickname").value,
    nicknameTime: document.getElementById("nickname_time").textContent,
    alias: document.getElementById("alias").value,
    aliasTime: document.getElementById("alias_time").textContent,
    alterEgo: document.getElementById("alter_ego").value,
    alterEgoTime: document.getElementById("alter_ego_time").textContent,
    prefix: document.getElementById("prefix").value,
    prefixTime: document.getElementById("prefix_time").textContent,
    suffix: document.getElementById("suffix").value,
    suffixTime: document.getElementById("suffix_time").textContent,
    formerName: document.getElementById("former_name").value,
    formerNameTime: document.getElementById("former_name_time").textContent,
    nameOrigin: document.getElementById("name_origin").value,
    nameOriginTime: document.getElementById("name_origin_time").textContent,
    personalThoughts1: document.getElementById("personal_thoughts_1").value,
    personalThoughts1Time: document.getElementById("personal_thoughts_1_time").textContent,
  };

  const op5Content = generateOp5FileContent(data);
  downloadOp5File(validatedFilename, op5Content);
}

// Function to generate .op5 file contents
function generateOp5FileContent(data) {
  const op5Content = `; OpenProfile 5 Preview
pageAuthor: ${unescapeNewlines(data.pageAuthor) || ""}
writtenDate: ${unescapeNewlines(data.writtenDate) || ""}
fullName: ${unescapeNewlines(data.fullName) || ""}
fullNameTime: ${unescapeNewlines(data.fullNameTime) || ""}
firstName: ${unescapeNewlines(data.firstName) || ""}
firstNameTime: ${unescapeNewlines(data.firstNameTime) || ""}
middleName: ${unescapeNewlines(data.middleName) || ""}
middleNameTime: ${unescapeNewlines(data.middleNameTime) || ""}
lastName: ${unescapeNewlines(data.lastName) || ""}
lastNameTime: ${unescapeNewlines(data.lastNameTime) || ""}
nickname: ${unescapeNewlines(data.nickname) || ""}
nicknameTime: ${unescapeNewlines(data.nicknameTime) || ""}
alias: ${unescapeNewlines(data.alias) || ""}
aliasTime: ${unescapeNewlines(data.aliasTime) || ""}
alterEgo: ${unescapeNewlines(data.alterEgo) || ""}
alterEgoTime: ${unescapeNewlines(data.alterEgoTime) || ""}
prefix: ${unescapeNewlines(data.prefix) || ""}
prefixTime: ${unescapeNewlines(data.prefixTime) || ""}
suffix: ${unescapeNewlines(data.suffix) || ""}
suffixTime: ${unescapeNewlines(data.suffixTime) || ""}
formerName: ${unescapeNewlines(data.formerName) || ""}
formerNameTime: ${unescapeNewlines(data.formerNameTime) || ""}
nameOrigin: ${escapeNewlines(data.nameOrigin) || ""}
nameOriginTime: ${unescapeNewlines(data.nameOriginTime) || ""}
personalThoughts1: ${escapeNewlines(data.personalThoughts1) || ""}
personalThoughts1Time: ${unescapeNewlines(data.personalThoughts1Time) || ""}`;

  return op5Content;
}

function escapeNewlines(text) {
  return text.replace(/\n/g, '\\n');
}

// Function to download a .op5 file
function downloadOp5File(filename, content) {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
  element.setAttribute("download", filename);
   
  element.style.display = "none";
  document.body.appendChild(element);
 
  element.click();
 
  document.body.removeChild(element);
}
// Load data
function loadData() {
  const fileInput = document.getElementById("loadFileInput");
  const selectedFile = fileInput.files[0];

  if (selectedFile) {
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (fileExtension === 'op5') {
      readFile(selectedFile, populateFormFields);
    } else {
      alert("Please select a valid .op5 file.");
    }
  } else {
    alert("Please select a file to load.");
  }
}

function populateFormFields(data) {
  const lines = data.split('\n');
  const parsedData = {};

  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      parsedData[key] = value;
    }
  }

  document.getElementById("page_author").value = unescapeNewlines(parsedData.pageAuthor) || "";
  document.getElementById("written_date").value = unescapeNewlines(parsedData.writtenDate) || "";
  document.getElementById("full_name").value = unescapeNewlines(parsedData.fullName) || "";
  document.getElementById("full_name_time").textContent = unescapeNewlines(parsedData.fullNameTime) || "";
  document.getElementById("first_name").value = unescapeNewlines(parsedData.firstName) || "";
  document.getElementById("first_name_time").textContent = unescapeNewlines(parsedData.firstNameTime) || "";
  document.getElementById("middle_name").value = unescapeNewlines(parsedData.middleName) || "";
  document.getElementById("middle_name_time").textContent = unescapeNewlines(parsedData.middleNameTime) || "";
  document.getElementById("last_name").value = unescapeNewlines(parsedData.lastName) || "";
  document.getElementById("last_name_time").textContent = unescapeNewlines(parsedData.lastNameTime) || "";
  document.getElementById("nickname").value = unescapeNewlines(parsedData.nickname) || "";
  document.getElementById("nickname_time").textContent = unescapeNewlines(parsedData.nicknameTime) || "";
  document.getElementById("alias").value = unescapeNewlines(parsedData.alias) || "";
  document.getElementById("alias_time").textContent = unescapeNewlines(parsedData.aliasTime) || "";
  document.getElementById("alter_ego").value = unescapeNewlines(parsedData.alterEgo) || "";
  document.getElementById("alter_ego_time").textContent = unescapeNewlines(parsedData.alterEgoTime) || "";
  document.getElementById("prefix").value = unescapeNewlines(parsedData.prefix) || "";
  document.getElementById("prefix_time").textContent = unescapeNewlines(parsedData.prefixTime) || "";
  document.getElementById("suffix").value = unescapeNewlines(parsedData.suffix) || "";
  document.getElementById("suffix_time").textContent = unescapeNewlines(parsedData.suffixTime) || "";
  document.getElementById("former_name").value = unescapeNewlines(parsedData.formerName) || "";
  document.getElementById("former_name_time").textContent = unescapeNewlines(parsedData.formerNameTime) || "";
  document.getElementById("name_origin").value = unescapeNewlines(parsedData.nameOrigin) || "";
  document.getElementById("name_origin_time").textContent = unescapeNewlines(parsedData.nameOriginTime) || "";
  document.getElementById("personal_thoughts_1").value = unescapeNewlines(parsedData.personalThoughts1) || "";
  document.getElementById("personal_thoughts_1_time").textContent = unescapeNewlines(parsedData.personalThoughts1Time) || "";
}

function unescapeNewlines(text) {
  return text.replace(/\\n/g, '\n');
}

function readFile(file, callback) {
  const reader = new FileReader();
  reader.onload = function(event) {
    callback(event.target.result);
  };
  reader.readAsText(file);
}