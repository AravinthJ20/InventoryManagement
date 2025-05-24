function logout() {
    // Remove the token from localStorage
    localStorage.removeItem('admintoken');
sessionStorage.removeItem('cachedMenus')
sessionStorage.removeItem('cacheTimestamp')

    // Optionally, you can also clear any other user-related data or session storage here

    // Redirect to the login page or home page
    window.location.href = '/logout'; // Redirect to the home page or login page
}

// let sessionCheckInterval;

// async function checkSession() {
//     try {
//         const response = await fetch('/userRoutes/checkSession'); // Create this route on your server
//         if (response.status === 401) {
//             alert("Your session has expired. Please log in again.");
//             console.log('sesssion expired')
//             clearInterval(sessionCheckInterval); // Stop the interval



//             window.location.href = '/'; 
//             showPopup("Your session has expired. Please log in again.")


//         }
//     } catch (error) {
//         console.error("Error checking session:", error);
//     }
// }

// // Polling every 30 seconds (30000 milliseconds)
// sessionCheckInterval = setInterval(checkSession, 100000)
// console.log("Session check interval started with ID:", sessionCheckInterval); // Debugging log


async function downloadExcel() {
    const table = document.getElementById('customers');
    const rows = table.querySelectorAll('tr');
    const tableData = [];
    const headers = [];

    // Get the headers
    table.querySelectorAll('th').forEach((header, headerIndex) => {
        headers.push(header.innerText.trim());
    });

    // Loop through rows and gather data
    rows.forEach((row, rowIndex) => {
        const rowData = {};
        row.querySelectorAll('td').forEach((cell, cellIndex) => {
            rowData[headers[cellIndex]] = cell.textContent.trim();
        });
        if (Object.keys(rowData).length) {
            tableData.push(rowData);
        }
    });

    try {
        const response = await fetch('/userRoutes/downloadExcel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tableData }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate and download Excel file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medicine_data.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating and downloading Excel file:', error);
    }
}
// Define the columns to include in the download

async function downloadPartialExcel(columnsToDownload) {
   const table = document.getElementById('customers');
   const rows = table.querySelectorAll('tr');
   const tableData = [];
   const headers = [];
   const columnIndexes = [];

   // Get the headers and their indexes for the specified IDs
   table.querySelectorAll('th').forEach((header, index) => {
       if (columnsToDownload.includes(header.id)) {
           headers.push(header.innerText.trim());
           columnIndexes.push(index);
       }
   });

   // Loop through rows and gather data for specified columns only
   rows.forEach((row) => {
       const rowData = {};
       row.querySelectorAll('td').forEach((cell, index) => {
           if (columnIndexes.includes(index)) {
               const columnName = headers[columnIndexes.indexOf(index)];
               rowData[columnName] = cell.textContent.trim();
           }
       });
       if (Object.keys(rowData).length) {
           tableData.push(rowData);
       }
   });

   // Send the filtered data to the server
   try {
       const response = await fetch('/userRoutes/downloadExcel', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify({ tableData }),
       });

       if (!response.ok) {
           throw new Error('Failed to generate and download Excel file');
       }

       const blob = await response.blob();
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'partial_medicine_data.xlsx';
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       window.URL.revokeObjectURL(url);
   } catch (error) {
       console.error('Error generating and downloading Excel file:', error);
   }
}

//page permission checker
function decodeJwt(token) {
    const base64Url = token.split('.')[1]; // Get payload
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // URL-safe Base64 decode
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
   }
   let token=localStorage.getItem('admintoken')
  
   let decodeToken=decodeJwt(token)
   function checkPermissions(userRole, requiredPermissions) {
    return requiredPermissions.includes(userRole);
  }
   function pagePermissions() {
      let userRole=decodeToken.role
    let requiredPermissions = PageControls.find(control => control.pagePermissions).pagePermissions;
    let isAuthorized = checkPermissions(userRole, requiredPermissions);
  
    if (!isAuthorized) {
      document.getElementById('authCheck').style.display = 'block';
      // document.getElementById('authCheck').innerText = 'You do not have authorization for this page';
      // Optionally, hide other content or disable interactions
      document.querySelector('.main-content').style.display = 'none';
    } else {
      document.getElementById('authCheck').style.display = 'none';
      document.querySelector('.main-content').style.display = 'block';
    }
  }
  

  //filter
  function openFilter(tableID,PageControls) {
    const filterPopup = document.getElementById('filter-popup');
    const filterContentLeft = document.getElementById('filter-content-left');
    const filterContentRight = document.getElementById('filter-content-right');

    // Clear previous content
    filterContentLeft.innerHTML = '';
    filterContentRight.innerHTML = '<p>Select a column on the left to see filter options.</p>';

    // Find the table configuration in PageControls
    const tableConfig = PageControls.find(control => control.table && control.table.some(table => table.tableID === tableID));
    if (!tableConfig) {
        console.error(`Table configuration for tableID "${tableID}" not found in PageControls.`);
        return;
    }

    const filterColumns = tableConfig.table.find(table => table.tableID === tableID).filterColumns;

    // Get table headers
    const table = document.getElementById(tableID);
    console.log('table in filter',table,tableID)
    const headers = table.querySelectorAll('th');

    // Create filter options only for columns in filterColumns
    headers.forEach((header, index) => {
        const columnName = header.innerText.trim();
        const filterColumn = filterColumns.find(filterCol => filterCol.columnName === columnName);

        if (filterColumn) {
            const filterOption = document.createElement('div');
            filterOption.innerText = columnName;
            filterOption.style.cursor = 'pointer';
            filterOption.onclick = () => populateFilterValues(tableID, index, filterColumn.filterType, filterColumn);

            filterContentLeft.appendChild(filterOption);
        }
    });

    filterPopup.style.display = 'flex'; // Show the filter popup
}
function populateFilterValues(tableID, columnIndex, filterType, filterColumn) {
    const filterContentRight = document.getElementById('filter-content-right');
    filterContentRight.innerHTML = ''; // Clear previous values
    const techname = filterColumn.techname;

    if (filterType === 'checkbox') {
        // Search bar for checkbox filter
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.id = 'filter-search';
        searchInput.oninput = filterCheckboxes; // Call filter function on input

        filterContentRight.appendChild(searchInput);

        // Get the filter data from the response
        const tableConfig = PageControls.find(control => control.table && control.table.some(table => table.tableID === tableID));
        if (!tableConfig) {
            console.error(`Table configuration for tableID "${tableID}" not found in PageControls.`);
            return;
        }

        const filterColumns = tableConfig.table.find(table => table.tableID === tableID).filterColumns;
        const checkboxData = filterColumns.find(col => col.techname === techname)?.data;

        if (!checkboxData || !Array.isArray(checkboxData[0])) {
            console.error(`No checkbox data found for techname: ${techname}`);
            return;
        }

        // Checkbox filter for categorical data
        const checkboxContainer = document.createElement('div');
        checkboxContainer.id = 'checkbox-container'; // Container to hold all checkboxes

        checkboxData[0].forEach(value => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.id = `filter-${value}`;
            checkbox.onchange = () => applyFilters(tableID, filterColumn, columnIndex);

            const label = document.createElement('label');
            label.htmlFor = `filter-${value}`;
            label.innerText = value;

            const div = document.createElement('div');
            div.classList.add('checkbox-item');
            div.appendChild(checkbox);
            div.appendChild(label);

            checkboxContainer.appendChild(div);
        });

        filterContentRight.appendChild(checkboxContainer);
    } else if (filterType === 'number') {
        // Number range filter
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.placeholder = 'Min';
        minInput.id = `filter-${techname}-min`;

        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.placeholder = 'Max';
        maxInput.id = `filter-${techname}-max`;

        const applyButton = document.createElement('button');
        applyButton.innerText = 'Apply';
        applyButton.onclick = () => applyFilters(tableID, filterColumn);

        filterContentRight.appendChild(minInput);
        filterContentRight.appendChild(maxInput);
        filterContentRight.appendChild(applyButton);
    } else if (filterType === 'dateRange') {
        // Date range filter
        const startDate = document.createElement('input');
        startDate.type = 'date';
        startDate.id = `filter-${techname}-start-date`;

        const endDate = document.createElement('input');
        endDate.type = 'date';
        endDate.id = `filter-${techname}-end-date`;

        const applyButton = document.createElement('button');
        applyButton.innerText = 'Apply';
        applyButton.onclick = () => applyFilters(tableID, filterColumn, columnIndex);

        filterContentRight.appendChild(startDate);
        filterContentRight.appendChild(endDate);
        filterContentRight.appendChild(applyButton);
    }

    document.getElementById('filter-popup').style.display = 'flex';
}

function applyFilters(tableID, filterColumn, columnIndex) {
    const filterType = filterColumn.filterType;
    const techname = filterColumn.techname;
    const tableContainer = document.getElementById(tableID).closest('.table-container');
    if (!tableContainer) {
        console.error(`Table container not found for tableID: ${tableID}`);
        return;
    }

    const datasource = tableContainer.getAttribute('datasource');
    if (!datasource) {
        console.error(`Datasource not found for tableID: ${tableID}`);
        return;
    }
    if (filterType === 'checkbox') {
        const checkboxes = document.querySelectorAll('#filter-content-right input[type="checkbox"]');
        const selectedValues = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (selectedValues.length) {
            selectedFilters[techname] = { $in: selectedValues };
        } else {
            delete selectedFilters[techname];
        }
    } else if (filterType === 'number') {
        const min = Number(document.getElementById(`filter-${techname}-min`).value);
        const max =Number(document.getElementById(`filter-${techname}-max`).value);
        if (min || max) {
            selectedFilters[techname] = {};
            if (min) selectedFilters[techname].$gte = min;
            if (max) selectedFilters[techname].$lte = max;
        } else {
            delete selectedFilters[techname];
        }
    } else if (filterType === 'dateRange') {
        const startDate = document.getElementById(`filter-${techname}-start-date`).value;
        const endDate = document.getElementById(`filter-${techname}-end-date`).value;

        if (startDate || endDate) {
            selectedFilters[techname] = {};
            if (startDate) selectedFilters[techname].$gte = startDate;
            if (endDate) selectedFilters[techname].$lte = endDate;
        } else {
            delete selectedFilters[techname];
        }
    }

    // Now you can use the selectedFilters object to build your query
    console.log('Selected Filters:', selectedFilters);
    loadData(currentPage, rowsPerPage,datasource, selectedFilters);
}

function filterCheckboxes() {
   const searchQuery = document.getElementById('filter-search').value.toLowerCase();
   const checkboxes = document.querySelectorAll('#checkbox-container .checkbox-item');

   checkboxes.forEach(item => {
       const label = item.querySelector('label').innerText.toLowerCase();
       if (label.includes(searchQuery)) {
           item.style.display = ''; // Show if it matches search
       } else {
           item.style.display = 'none'; // Hide if it doesn't match
       }
   })};

function closeFilter() {
   document.getElementById('filter-popup').style.display = 'none';
}

function loadFilter(){
    console.log('load filter')
    fetch('/loadFilter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(PageControls)
        })  .then(response => response.json())
        .then(responseData => {
            console.log('Response Data:', responseData);
            PageControls[1]=responseData
        
        })
        .catch(error => console.error('Error:', error))
      
  }
//filter end

// collapse container
function toggleTable(input) {
    console.log('toogle called',input,input.innerText);
    console.log('parent',input.parentElement.parentElement.nextElementSibling)
    let value=input.innerText
    let collapse=input.parentElement.parentElement.nextElementSibling
    input.innerText=value=='+'?'-':'+';
    input.class="test"
    const table = document.querySelector('.collpase-container');
    // table.style.display = (table.style.display === 'none') ? '' : 'none';
    collapse.style.display = (collapse.style.display === 'none') ? '' : 'none';

    console.log(table.style.display)

}

  function toggleTable(input) {
            console.log('toogle called', input, input.innerText);
            console.log('parent', input.parentElement.parentElement.nextElementSibling)
            let value = input.innerText
            let collapse = input.parentElement.parentElement.nextElementSibling
            input.innerText = value == '+' ? '-' : '+';
            const table = document.querySelector('.collpase-container');
            // table.style.display = (table.style.display === 'none') ? '' : 'none';
            collapse.style.display = (collapse.style.display === 'none') ? '' : 'none';

            console.log(table.style.display)

        }

//collapse container end


//table empty data check
function checkTableForEmptyData(tableId) {
    const table = document.getElementById(tableId);
    const tableBody = table.querySelector('tbody');
    if (!tableBody) return; // Exit if the table body doesn't exist

    const noDataRowId = `${tableId}-noData`;
    const existingNoDataRow = document.getElementById(noDataRowId);

    if (tableBody.rows.length === 0) {
        // If no data row doesn't exist, create it
        if (!existingNoDataRow) {
            const noDataRow = document.createElement('tr');
            noDataRow.id = noDataRowId;
            const noDataCell = document.createElement('td');
            const columnCount = table.querySelectorAll('th').length || 1;
            noDataCell.setAttribute('colspan', columnCount); // Span all columns

            // Create an image element
            const noDataImage = document.createElement('img');
            noDataImage.src = '/images/nodata.jpg'; // Set the path to your image
            noDataImage.alt = 'No data available';
            noDataImage.style.display = 'block';

            noDataImage.style.margin = '20px auto'; // Center the image horizontally

            // Append the image to the cell
            noDataCell.appendChild(noDataImage);
            noDataRow.appendChild(noDataCell);
            tableBody.appendChild(noDataRow);
        }
    } else {
        // Remove the existing "No data" row if data is present
        if (existingNoDataRow) {
            existingNoDataRow.remove();
        }
    }
}
function tableDataCheck() {
    const tables = document.querySelectorAll('table');

    // Iterate over each table and apply the checkTableForEmptyData function
    tables.forEach((table, index) => {
        // Ensure each table has a unique ID
        if (!table.id) {
            table.id = `table-${index}`;
        }
        checkTableForEmptyData(table.id);
    });

}
//..table empty check end..//


