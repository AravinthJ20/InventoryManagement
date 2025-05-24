

// Load the categories into the popup table
function loadPopupTable() {
    const popupTable = document.getElementById("popupTable");
    popupTable.innerHTML = ""; // Clear any existing rows
    categories.forEach((category, index) => {
        const row = document.createElement("tr");
        row.innerHTML = ` 
          <td><input type="checkbox" class="category-checkbox" data-index="${index}"></td>
          <td>${category.category}</td>
          <td>${category.subCategory}</td>
          <td>${category.description}</td>
          
           
          
        `;
        popupTable.appendChild(row);
    });

}



// Select/Deselect all checkboxes in the parent table when the header checkbox is clicked
const selectAllCheckbox = document.getElementById("selectAllCheckbox");

selectAllCheckbox.addEventListener("change", () => {
    const allCheckboxes = document.querySelectorAll(".row-checkbox");
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
});

// Select/Deselect all checkboxes in the popup table when the header checkbox is clicked
const selectAllPopupCheckbox = document.getElementById("selectAllPopupCheckbox");

selectAllPopupCheckbox.addEventListener("change", () => {
    const allPopupCheckboxes = document.querySelectorAll(".category-checkbox");
    allPopupCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllPopupCheckbox.checked;
    });


});


/*...general and action popups...*/
    function showPopup(type, message) {

        console.log('general popup called')
    const popupId = type + 'Popup';
    const popup = document.getElementById(popupId);
    const messageElement = document.getElementById(type + 'Message');
    if (popup && messageElement) {
        messageElement.innerText = message || '';
        popup.classList.add('visible');
    }
}

function closeGeneralPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.remove('visible');
    }
}

function onConfirm() {
    closePopup('confirmPopup');
    console.log('User confirmed the action.');
}


/*...general and action popups...*/


/*..model box popup..*/

function showBroadcast(title, message) {
    const popup = document.getElementById('broadcastPopup');
    const titleElement = document.getElementById('broadcastTitle');
    const messageElement = document.getElementById('broadcastMessage');

    titleElement.textContent = title || 'Broadcast Message';
    messageElement.textContent = message || 'This is an important message for all users.';
    popup.classList.add('visible');
}

function hideBroadcast() {
    const popup = document.getElementById('broadcastPopup');
    popup.classList.remove('visible');
}

function acknowledgeBroadcast() {
    alert('You have acknowledged the message!');
    hideBroadcast();
}

/*..model box popup end..*/
