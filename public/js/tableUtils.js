 
 //..upload excel ..//
 // Function to download a template in XLSX format
 function downloadTemplate() {
    // Create a worksheet with header only
    const worksheetData = [TEMPLATE_COLUMNS];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Generate the file and trigger download
    XLSX.writeFile(workbook, "template.xlsx");
}

// Function to handle Excel file upload
function uploadExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Assuming the first sheet is relevant
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Validate template columns
        const [headerRow, ...dataRows] = rows;
        if (!validateTemplate(headerRow)) {
            alert("Invalid template format. Please ensure the column headers match the required template.");
            return;
        }

        populateTable(dataRows);
    };
    reader.readAsArrayBuffer(file);
}

// Function to validate uploaded Excel template
function validateTemplate(headerRow) {
    return JSON.stringify(headerRow) === JSON.stringify(TEMPLATE_COLUMNS);
}

// Function to populate the table with Excel data
function populateTable(data) {
    const tbody = document.querySelector("#addrowtest tbody");
    tbody.innerHTML = ""; // Clear existing rows

    data.forEach((row) => {
        const tr = document.createElement("tr");
        const cells = TEMPLATE_COLUMNS.map((col, index) => `<td><input type="text" name="${col.toLowerCase()}" value="${row[index] || ''}"></td>`).join("");
        tr.innerHTML = cells + `<td><button class="deleteRowBtn" onclick="deleteRow(this);">-</button></td>`;
        tbody.appendChild(tr);
    });
}

// Function to delete a row
function deleteRow(button) {
    const row = button.closest("tr");
    row.remove();
    checkTableForEmptyData("addrowtest")

}


//... upload excel end ..//

//.. more action buttons ..//

  // Function to move extra action buttons to the popup
  function moveButtonsToPopup() {
    // Clear the popup before moving the buttons
    moreActions.innerHTML = '';

    // Get all the action buttons
    const actionButtons = actionsContainer.querySelectorAll('.action-btn');

    // On mobile view, move all buttons to the popup
    if (window.innerWidth <= 768) {
        actionButtons.forEach(button => {
            const buttonClone = button.cloneNode(true); // Clone each button
            moreActions.appendChild(buttonClone);
            button.style.display = 'none'; // Hide button in header
        });
    } else {
        // On larger view, move buttons beyond the 5th to the popup
        actionButtons.forEach((button, index) => {
            if (index >= 4) {
                const buttonClone = button.cloneNode(true); // Clone each button
                moreActions.appendChild(buttonClone);
                button.style.display = 'none'; // Hide extra buttons in header
            } else {
                button.style.display = 'inline-block'; // Show first 5 buttons in header
            }
        });
    }
}

// Toggle popup visibility
function togglePopup() {
    moreActions.style.display = moreActions.style.display === 'block' ? 'none' : 'block';
}

// Close popup on outside click
document.addEventListener('click', function (event) {
    const threeDotButton = document.querySelector('.three-dot-btn');
    // Check if the click is outside the popup and the three-dot button
    if (!moreActions.contains(event.target) && event.target !== threeDotButton) {
        moreActions.style.display = 'none';
    }
});

// Handle responsive design
window.addEventListener('resize', function () {
    moveButtonsToPopup(); // Update button positions based on screen size
});

// more action buttons end //