
function ageCheck() {
    let isValid = true;
    let errorMessages = [];

    // Example conditions:
    const ageInput = document.querySelector('input[name="age"]');
    if (ageInput && parseInt(ageInput.value, 10) < 18) {
        errorMessages.push('Age must be 18 or older.');
        console.log('age condtion..')
        isValid = false;
    }





    // If any conditions fail, show a popup and return false
    if (!isValid) {
        showPopup('Condition Check Errors', errorMessages.join('\n'));
    }

    return isValid;
}


function validateTableRows(tableId, errors) {
    const table = document.getElementById(tableId);
    if (table) {
        const tableBody = table.querySelector('tbody');
        if (tableBody && tableBody.rows.length === 0) {
            errors.push('The table must contain at least one row.');
        }
    }
}

function validateAge(errors) {
    const ageInput = document.querySelector('input[name="age"]');
    if (ageInput) {
        const age = parseInt(ageInput.value, 10);
        if (isNaN(age) || age < 18) {
            errors.push('Age must be 18 or older.');
        }
    }
}

function validateEmail(errors) {
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) {
        const email = emailInput.value.trim();
        if (!email.endsWith('@example.com')) {
            errors.push('Email must end with @example.com.');
        }
    }
}

function validateTermsAcceptance(errors) {
    const termsCheckbox = document.querySelector('input[name="terms"]');
    if (termsCheckbox && !termsCheckbox.checked) {
        errors.push('You must accept the terms and conditions.');
    }
}

    function showPopup(title, message) {
        const popup = document.createElement('div');
        popup.className = 'popup2';

        const popupContent = `
        <div class="popup-overlay"></div>
        <div class="popup-box">
            <h2>${title}</h2>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <button onclick="closePopup()">Close</button>
        </div>
    `;
        popup.innerHTML = popupContent;
        document.body.appendChild(popup);
    }

    function closePopup() {
        const popup = document.querySelector('.popup2');
        if (popup) popup.remove();
    }

    // function closePopup(popupId) {
    //     document.querySelector(`#${popupId}`).style.display = 'none';
    // }
    function collectPayload() {
        // Validate the page first
        if (!validatePage2()) {
            console.error('Validation failed. Aborting payload collection.');
            return null; // Stop processing if validation fails
        }
        // Call the checkConditions function
        if (!checkConditions()) {
            console.error('Condition checks failed. Submission aborted.');
            return; // Stop if conditions are not met
        }

        const payload = {};

        // Collect data from all required fields
        const requiredInputs = document.querySelectorAll('input, textarea, select');
        requiredInputs.forEach((input) => {
            if (input.name) {
                payload[input.name] = input.value;
            }
        });
        const forms = document.querySelectorAll('form');

        forms.forEach((form, index) => {


            const formData = new FormData(form);
            const formPayload = {};
            formData.forEach((value, key) => {
                if (formPayload[key]) {
                    // If key already exists, convert it to an array and append the new value
                    if (!Array.isArray(formPayload[key])) {
                        formPayload[key] = [formPayload[key]];
                    }
                    formPayload[key].push(value);
                } else {
                    formPayload[key] = value;
                }
            });
            payload[`form_${index + 1}`] = formPayload;
        });



        // Collect data from all tables
        const tables = document.querySelectorAll('table');

        // tables.forEach((table, index) => {
        //     const tableData = [];
        //     const rows = table.querySelectorAll('tbody tr');
        //     rows.forEach(row => {
        //         const rowData = {};
        //         row.querySelectorAll('input').forEach(input => {
        //             rowData[input.name] = input.value;
        //         });
        //         tableData.push(rowData);
        //     });
        //     payload[`table_${index + 1}`] = tableData;
        // });


        // test2
        //     tables.forEach((table, index) => {
        //     const tableData = [];
        //     const rows = table.querySelectorAll('tbody tr');

        //     rows.forEach(row => {
        //         const rowData = {};

        //         // Iterate over each cell in the row
        //         row.querySelectorAll('td').forEach(cell => {
        //             const input = cell.querySelector('input');
        //             const span = cell.querySelector('span');

        //             if (input) {
        //                 // If the cell contains an input field, get its value
        //                 rowData[input.name] = input.value;
        //             } else if (span) {
        //                 // If the cell contains a span (or any other static text), get its text content
        //                 rowData[span.getAttribute('name')] = span.textContent.trim();
        //             } else {
        //                 // If there's neither an input nor a span, you can collect static content from the cell itself
        //                 rowData[cell.getAttribute('data-name')] = cell.textContent.trim();
        //             }
        //         });

        //         tableData.push(rowData);
        //     });

        //     payload[`table_${index + 1}`] = tableData;
        // });
        tables.forEach((table, index) => {
            const tableData = [];
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const rowData = {};

                // Iterate over each cell in the row
                row.querySelectorAll('td').forEach(cell => {
                    const input = cell.querySelector('input');
                    const span = cell.querySelector('span');

                    if (input) {
                        // If the cell contains an input field, get its value
                        rowData[input.name] = input.value;
                    } else if (span) {
                        // If the cell contains a span, get its text content and check the data-type attribute
                        const spanValue = span.textContent.trim();
                        const type = span.getAttribute('data-type');

                        if (type === 'number') {
                            // Convert to a number
                            rowData[span.getAttribute('name')] = isNaN(spanValue) ? spanValue : Number(spanValue);
                        } else if (type === 'date') {
                            // Convert to a date object (assuming it's in a valid format)
                            rowData[span.getAttribute('name')] = new Date(spanValue);
                        } else {
                            // If type is string or undefined, just use the text content
                            rowData[span.getAttribute('name')] = spanValue;
                        }
                    } else {
                        // If there's neither an input nor a span, you can collect static content from the cell itself
                        rowData[cell.getAttribute('data-name')] = cell.textContent.trim();
                    }
                });

                tableData.push(rowData);
            });

            payload[`table_${index + 1}`] = tableData;
        });

        return payload;
    }

    function submitFormData() {
        try {
            const payload = collectPayload(); // Collect validated form data
            console.log('Collected Payload:', payload);
            // Send to backend
            fetch('/PostData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
                .then((response) => response.json())
                .then((data) => {
                    let SupplierID = data.primaryKey
                    // alert(`Submission successful!${data.primaryKey}`);
                    Swal.fire({
                        icon: 'success',
                        title: 'Form submitted successfully!',
                        text: 'Order ID: ' + SupplierID,
                        confirmButtonText: 'OK',
                        customClass: {
                            popup: 'custom-swal-width'
                        }
                    }).then((result) => {
                        // Redirect to the GET endpoint with the orderid as a query parameter
                        if (result.isConfirmed) {
                            window.location.href = `/views/VendorList.htm`;
                        }
                    })
                    console.log('Response from server:', data);
                })
                .catch((error) => {
                    console.error('Error submitting form:', error);
                });
        } catch (error) {
            console.error(error.message);
        }
    }
