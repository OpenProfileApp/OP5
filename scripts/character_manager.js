const profileList = document.getElementById("profile-list");
const profileContentInput = document.getElementById("profile-content");
const addProfileButton = document.getElementById("add-profile");
const pageAuthor = document.getElementById("page_author");
const writtenDate = document.getElementById("written_date");
const fullName = document.getElementById("full_name");
const fullNameTime = document.getElementById("full_name_time");
const firstName = document.getElementById("first_name");
const firstNameTime = document.getElementById("first_name_time");
const middleName = document.getElementById("middle_name");
const middleNameTime = document.getElementById("middle_name_time");
const lastName = document.getElementById("last_name");
const lastNameTime = document.getElementById("last_name_time");
const nickname = document.getElementById("nickname");
const nicknameTime = document.getElementById("nickname_time");
const alias = document.getElementById("alias");
const aliasTime = document.getElementById("alias_time");
const alterEgo = document.getElementById("alter_ego");
const alterEgoTime = document.getElementById("alter_ego_time");
const prefix = document.getElementById("prefix");
const prefixTime = document.getElementById("prefix_time");
const suffix = document.getElementById("suffix");
const suffixTime = document.getElementById("suffix_time");
const formerName = document.getElementById("former_name");
const formerNameTime = document.getElementById("former_name_time");
const nameOrigin = document.getElementById("name_origin");
const nameOriginTime = document.getElementById("name_origin_time");
const personalThoughts1 = document.getElementById("personal_thoughts_1");
const personalThoughts1Time = document.getElementById("personal_thoughts_1_time");

// Load existing profiles from local storage
const savedProfiles = JSON.parse(localStorage.getItem("profiles")) || [];

// Function to update the list display
function updateList() {
    profileList.innerHTML = savedProfiles.map((profile, index) => `
        <li>
            ${profile.name}
            <button onclick="removeProfile(${index})">Remove Profile</button>
            <button onclick="loadProfile(${index})">Load Profile</button>
        </li>
    `).join("");
}

// Function to add a new profile
function addProfile() {
    const profileName = window.prompt("Enter a name for the profile:");
    if (profileName !== null && profileName.trim() !== "") {
        const formData = {
            pageAuthor: pageAuthor.value,
            writtenDate: writtenDate.value,
            fullName: fullName.value,
            fullNameTime: fullNameTime.textContent,
            firstName: firstName.value,
            firstNameTime: firstNameTime.textContent,
            middleName: middleName.value,
            middleNameTime: middleNameTime.textContent,
            lastName: lastName.value,
            lastNameTime: lastNameTime.textContent,
            nickname: nickname.value,
            nicknameTime: nicknameTime.textContent,
            alias: alias.value,
            aliasTime: aliasTime.textContent,
            alterEgo: alterEgo.value,
            alterEgoTime: alterEgoTime.textContent,
            prefix: prefix.value,
            prefixTime: prefixTime.textContent,
            suffix: suffix.value,
            suffixTime: suffixTime.textContent,
            formerName: formerName.value,
            formerNameTime: formerNameTime.textContent,
            nameOrigin: nameOrigin.value,
            nameOriginTime: nameOriginTime.textContent,
            personalThoughts1: personalThoughts1.value,
            personalThoughts1Time: personalThoughts1Time.textContent
        };

        const newProfileContent = profileContentInput.value.trim();
        const newProfile = {
            name: profileName,
            content: newProfileContent,
            formData
        };

        savedProfiles.push(newProfile);
        localStorage.setItem("profiles", JSON.stringify(savedProfiles));
        profileContentInput.value = "";
        pageAuthor.value = "";
        writtenDate.value = "";
        // Set other input values to blank here

        updateList();
    }
}

// Function to remove a profile
function removeProfile(index) {
    const confirmation = confirm("Are you sure you want to remove this profile?");
    if (confirmation) {
        savedProfiles.splice(index, 1);
        localStorage.setItem("profiles", JSON.stringify(savedProfiles));
        updateList();
    }
}

// Function to load a profile into the textarea
function loadProfile(index) {
  profileContentInput.value = savedProfiles[index].content;
  pageAuthor.value = savedProfiles[index].formData.pageAuthor || "";
  writtenDate.value = savedProfiles[index].formData.writtenDate || "";
  fullName.value = savedProfiles[index].formData.fullName || "";
  fullNameTime.textContent = savedProfiles[index].formData.fullNameTime || "";
  firstName.value = savedProfiles[index].formData.firstName || "";
  firstNameTime.textContent = savedProfiles[index].formData.firstNameTime || "";
  middleName.value = savedProfiles[index].formData.middleName || "";
  middleNameTime.textContent = savedProfiles[index].formData.middleNameTime || "";
  lastName.value = savedProfiles[index].formData.lastName || "";
  lastNameTime.textContent = savedProfiles[index].formData.lastNameTime || "";
  nickname.value = savedProfiles[index].formData.nickname || "";
  nicknameTime.textContent = savedProfiles[index].formData.nicknameTime || "";
  alias.value = savedProfiles[index].formData.alias || "";
  aliasTime.textContent = savedProfiles[index].formData.aliasTime || "";
  alterEgo.value = savedProfiles[index].formData.alterEgo || "";
  alterEgoTime.textContent = savedProfiles[index].formData.alterEgoTime || "";
  prefix.value = savedProfiles[index].formData.prefix || "";
  prefixTime.textContent = savedProfiles[index].formData.prefixTime || "";
  suffix.value = savedProfiles[index].formData.suffix || "";
  suffixTime.textContent = savedProfiles[index].formData.suffixTime || "";
  formerName.value = savedProfiles[index].formData.formerName || "";
  formerNameTime.textContent = savedProfiles[index].formData.formerNameTime || "";
  nameOrigin.value = savedProfiles[index].formData.nameOrigin || "";
  nameOriginTime.textContent = savedProfiles[index].formData.nameOriginTime || "";
  personalThoughts1.value = savedProfiles[index].formData.personalThoughts1 || "";
  personalThoughts1Time.textContent = savedProfiles[index].formData.personalThoughts1Time || "";
}

// Initial list display
updateList();

// Add event listeners
addProfileButton.addEventListener("click", addProfile);
profileContentInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.ctrlKey) {
        addProfile();
    }
});