 // Function to extract data sources and dbcolumns from the section container
 function extractSectionData() {
    const formGroups = document.querySelectorAll('.form-group');
    const sectionData = [];

    formGroups.forEach(group => {
        const datasource = group.getAttribute('datasource');
        const dbcolumn = group.getAttribute('dbcolumn');
        if (datasource && dbcolumn) {
            sectionData.push({ datasource, dbcolumn, inputElement: group.querySelector('input') });
        }
    });

    return sectionData;
}
// function extractSectionData() {
//     const formGroups = document.querySelectorAll('.form-group');
//     const sectionData = [];

//     formGroups.forEach(group => {
//         const datasource = group.getAttribute('datasource');
//         const dbcolumn = group.getAttribute('dbcolumn');
//         const type = group.getAttribute('data-type') || 'string';
//         const isDisplayOnly = group.getAttribute('data-displayonly') === 'true';

//         let value = null;

//         if (isDisplayOnly) {
//             // Get text from span/div/etc.
//             const displayElement = group.querySelector('span, div');
//             value = displayElement?.textContent?.trim() ?? null;
//         } else {
//             const inputElement = group.querySelector('input, select, textarea');
//             value = inputElement?.value ?? null;
//         }

//         if (datasource && dbcolumn) {
//             sectionData.push({
//                 datasource,
//                 dbcolumn,
//                 type,
//                 value
//             });
//         }
//     });

//     return sectionData;
// }


// Function to extract data sources and dbcolumns from the table container
function extractTableData() {
    const tableContainers = document.querySelectorAll('.table-container');
    const tableData = [];

    tableContainers.forEach(tableContainer => {
        const tableDataSource = tableContainer.getAttribute('datasource');
        const tableHeaders = tableContainer.querySelectorAll('th');
        const tableDbColumns = [];

        tableHeaders.forEach(header => {
            const dbcolum = header.getAttribute('dbcolum');
            if (dbcolum) {
                tableDbColumns.push({ dbcolum, datasource: tableDataSource });
            }
        });

        tableData.push({ datasource: tableDataSource, dbcolumns: tableDbColumns });
    });

    return tableData;
}

// Combine all data sources
function combineDataSources(sectionData, tableData) {
    const sectionDataSources = sectionData.map(item => item.datasource);
    const tableDataSources = tableData.map(item => item.datasource);
    return [...new Set([...sectionDataSources, ...tableDataSources])];
}


function searchTable2(value,datasource){
    let searchInput=value.value
    console.log(value.value,datasource)
    loadData(1,10,datasource,null,searchInput)
        
    }
        // Function to load data for all tables or a specific table
        function loadData(page, limit, datasource = null,rowfilter,searchInput) {
            const skip = (page - 1) * limit;
    console.log('load data clalled')
            // Show the loading spinner
            const loadingSpinner = document.getElementById('loadingSpinner');
            loadingSpinner.style.display = 'flex';
    
            // Prepare the request data with skip and limit for the specified datasource(s)
            const pagination = {};
    
            if (datasource) {
                // Fetch data for a specific table
                console.log('if block get data')
                businessViews=[]
                businessViews.push(datasource)
                pagination[datasource] = { skip, limit,rowfilter, searchInput};
            } else {
                console.log('else block get data')

                // Fetch data for all tables (initial load)
                tableData.forEach(table => {
                    pagination[table.datasource] = { skip: 0, limit: rowsPerPage,rowfilter:rowfilter }; // Initial load for all tables
                });
            }
            function getQueryParam(param) {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get(param);
            }
    
            // Get the 'mediID' parameter from the URL
            const mediID = getQueryParam("mediID");
            // Prepare the request data
            const data = {
                "businessViews": businessViews,
                "params": {
                    "pagination": pagination,
                    "mediID":mediID
                }
            };
    
            // Send the request to the server
            fetch('/fetchPageData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(responseData => {
                console.log('Response Data:', responseData);
    
                // Populate the section fields dynamically (only on initial load)
              
                if (!datasource && page === 1) {
                    sectionData.forEach(sectionItem => {
                        const matchingDataSource = responseData.find(item => item.datasource === sectionItem.datasource);
                        if (matchingDataSource) {
                            const matchingRow = matchingDataSource.data.find(row => row[sectionItem.dbcolumn] !== undefined);
                            if (matchingRow) {
                                const value = matchingRow[sectionItem.dbcolumn];
                                // Check if this is an attachment field and initialize badge
                                if (sectionItem.inputElement && sectionItem.inputElement.id.includes('-article')) {
                                    sectionItem.inputElement.value = matchingRow[sectionItem.dbcolumn];

                                    const fieldId = sectionItem.inputElement.id.replace('-article', '');
                                    const articleId = matchingRow[sectionItem.dbcolumn];
                                    if (articleId) {
                                        articleIds[fieldId] = articleId;
                                        // Initialize with a count of 1 (or fetch actual count if needed)
                                        attachmentCounts[fieldId] = 1; 
                                        updateBadge(fieldId);
                                    }
                                } 
                               else if(sectionItem.inputElement) {
                                sectionItem.inputElement.value = value;
                            } else {
                                const displayElement = document.querySelector(
                                    `.form-group[datasource="${sectionItem.datasource}"][dbcolumn="${sectionItem.dbcolumn}"] .section-field`
                                );
                                if (displayElement) {
                                    displayElement.innerText = value;
                                }
                            }
                                
                            }
                        }
                    });
                }
    
                // Populate the table dynamically
                // tableData.forEach(table => {
                //     const tableDataSourceResponse = responseData.find(item => item.datasource === table.datasource);
                //     if (tableDataSourceResponse) {
                //         const tableBody = document.querySelector(`.table-container[datasource="${table.datasource}"] tbody`);
                //        if(tableDataSourceResponse.data!=null){
                //         tableBody.innerHTML = tableDataSourceResponse.data.map(row => `
                //             <tr>
                //                 ${table.dbcolumns.map(col => `<td>${row[col.dbcolum] || ''}</td>`).join('')}
                //             </tr>
                //         `).join('');
    
                //         // Update pagination controls for this table
                //         updatePaginationControls(table.datasource, page, tableDataSourceResponse.count, limit);
                //         }
                //     }
                // });
                let columnsNeedingBadges = [];
                let columnsNeedingEmbeddedCounts = [];
                let tableId;
                tableData.forEach(table => {
                   
        const tableDataSourceResponse = responseData.find(item => item.datasource === table.datasource);
        if (tableDataSourceResponse) {
            const tableBody = document.querySelector(`.table-container[datasource="${table.datasource}"] tbody`);
            const currentTable = document.querySelector(`.table-container[datasource="${table.datasource}"] table`);
tableId=currentTable.id
            //..before checkbox implementation in table...//


            //             if (tableDataSourceResponse.data != null) {
//                 tableBody.innerHTML = tableDataSourceResponse.data.map(row => `
//                     <tr>
//                         ${table.dbcolumns.map(col => {
//                             const thElement = document.querySelector(`th[dbcolum="${col.dbcolum}"]`);
//                             const inputType = thElement.getAttribute('type');
//                             const dataType = thElement?.getAttribute('data-type');

//                             let inputElement = '';
    
//                             if (inputType === 'inputString' || inputType === 'inputNumber' || inputType === 'inputDate') {
//                                 const type = inputType.replace('input', '').toLowerCase();
//                                 inputElement = `<td><input type="${type}" name="${col.dbcolum}" value="${row[col.dbcolum] || ''}" /></td>`;
//                             } 
//                             else if (dataType === 'link') {
//                                 // Get the href template and replace ${...} placeholders with actual row values
//                                 let hrefTemplate = thElement.getAttribute('href');
//                                 const href = hrefTemplate.replace(/\${(.*?)}/g, (_, key) => row[key] || '');
                        
//                                 inputElement = `<td><a class="styled-link" href="${href}">${row[col.dbcolum] || ''}</a></td>`;
//                             }
//                             else if (dataType === 'attachment') {
//                                 let articleId = row[col.dbcolum];
//                                 let uniqueId = `${col.dbcolum}-${articleId}`;
                              
//                                 inputElement = `
                                
//                                   <td>
//                 <div>
                   
//                         <span class="upload-icon" id="${col.dbcolum}" onclick="fetchAttachments2(this.id)"><i class="fa fa-upload"></i>
//                             <span class="badge" id="${uniqueId}-badge" style="display: none;">0</span>

//                         </span>
//                       <input type="hidden" id="${col.dbcolum}-article" name="supportDocs" value="${row[col.dbcolum] || ''}">
                     
//         </div>
//                 </td>
//                                 `;
                          
//                                 columnsNeedingBadges.push({ colName: col.dbcolum, articleId, uniqueId });



//                              }
//                             else if(dataType === 'status') {
//                                         inputElement = `<td  class="status"><span class="status-badge ${row[col.dbcolum]}">${row[col.dbcolum] || ''}</span></td>`
//                             }
//                             else if (dataType === 'date') {
//                                 const rawDate = row[col.dbcolum];
//                                 let formattedDate = '';
                                
//                                 if (rawDate) {
//                                     const dateObj = new Date(rawDate);
//                                     formattedDate = dateObj.toISOString().split('T')[0];  // Extract YYYY-MM-DD
//                                 }
                            
//                                 inputElement = `<td name="${col.dbcolum}" data-name="${col.dbcolum}">${formattedDate}</td>`;
//                             }
//                             else if (dataType == 'icon') {
//                                 let callFunction = thElement.getAttribute('data-click');
//                                 let icon = thElement.getAttribute('data-icon');

//                                 inputElement=`<td><i class="${icon}" onclick="${callFunction}"></i></a></td>`
                                
                              
//                             }
//                             else if (dataType === 'embeddedPage') {
//                              inputElement = ` <td>
//                     <div class="icon-container" onclick="openPopup()">
                        
//                         <i class="fa fa-table" id="item-count"><span class="badge">${5}</span></i>
//                     </div>
//                 </td>`;
//                             } 
//                             else if (dataType === 'checkbox') {
//                                 const checked = row[col.dbcolum] ? 'checked' : '';
//                                 inputElement = `<td><input type="checkbox" name="${col.dbcolum}" ${checked} /></td>`;
//                             }
//                             else if(dataType === 'table-collab') {
// inputElement=`<td>
//       <div class="collaboration-icons">
//         <i class="fa-regular fa-comment"></i>   
//         <i class="fa-regular fa-file"></i>      
//       </div>
//     </td>`                            }
//                                 else {
//                                 inputElement = `<td name="${col.dbcolum}" data-name="${col.dbcolum}">${row[col.dbcolum] || null}</td>`;
//                             }
    
//                             return inputElement;
//                         }).join('')}
//                     </tr>
//                 `).join('');

//                 // Update pagination controls for this table
//                 updatePaginationControls(table.datasource, page, tableDataSourceResponse.count, limit);
             
//                 columnsNeedingBadges.forEach(({ colName, articleId, uniqueId }) => {
//                     fetch(`/getAttachments?articleId=${articleId}`)
//                         .then((response) => response.json())
//                         .then((data) => {
//                             if (data.success) {
//                                 const count = data.attachments.length;
//                                 const badgeEl = document.getElementById(`${uniqueId}-badge`);
//                                 if (badgeEl) {
//                                     badgeEl.textContent = count;
//                                     badgeEl.style.display = count > 0 ? 'inline-block' : 'none';
//                                 }
//                             }
//                         })
//                         .catch(err => console.error('Failed to fetch attachments for', articleId, err));
//                 });
                
//             }

//..after checkbox implementation in table...//

if (tableDataSourceResponse.data != null) {
    tableBody.innerHTML = tableDataSourceResponse.data.map((row,rowIndex) => {
        const rowId = `row-${rowIndex}`;
        const rowData = {}; // Store all row data for condition checking
        

        return`
        <tr data-row-id="${rowId}">
            ${table.dbcolumns.map(col => {
                const thElement = document.querySelector(`th[dbcolum="${col.dbcolum}"]`);
                const inputType = thElement.getAttribute('type');
                const dataType = thElement?.getAttribute('data-type');
                let thName=thElement.textContent
                let inputElement = '';

                if (inputType === 'inputString' || inputType === 'inputNumber' || inputType === 'inputDate') {
                    const type = inputType.replace('input', '').toLowerCase();
                    inputElement = `<td data-label=${thName}><input type="${type}" name="${col.dbcolum}" value="${row[col.dbcolum] || ''}" /></td>`;
                } 
                else if (dataType === 'link') {
                    // Get the href template and replace ${...} placeholders with actual row values
                    let hrefTemplate = thElement.getAttribute('href');

                    const href = hrefTemplate.replace(/\${(.*?)}/g, (_, key) => row[key] || '');
            
                    inputElement = `<td data-label=${thName}><a class="styled-link" href="${href}">${row[col.dbcolum] || ''}</a></td>`;
                }
                else if (dataType === 'attachment') {
                    let articleId = row[col.dbcolum];
                    let uniqueId = `${col.dbcolum}-${articleId}`;
                  
                    inputElement = `
                    
                      <td data-label=${thName}>
    <div>
       
            <span class="upload-icon" id="${col.dbcolum}" onclick="fetchAttachments2(this.id)"><i  style="font-size:20px ;    font-weight: bold;"class="fa fa-paperclip"></i>
                <span class="badge" id="${uniqueId}-badge" style="display: none;">0</span>

            </span>
          <input type="hidden" id="${col.dbcolum}-article" name="supportDocs" value="${row[col.dbcolum] || ''}">
         
</div>
    </td>
                    `;
              
                    columnsNeedingBadges.push({ colName: col.dbcolum, articleId, uniqueId });



                 }
                else if(dataType === 'status') {
                            inputElement = `<td data-label=${thName} class="status"><span class="status-badge ${row[col.dbcolum]}">${row[col.dbcolum] || ''}</span></td>`
                }

                else if(dataType === 'button') {
                   try{
                   
                    let buttonClick = thElement.getAttribute('data-onclick');
                    let buttonOnload=thElement.getAttribute('data-onload');
                 let payload=row;
                     let result;
     // If there's an onload function, call it with the payload
     if (buttonOnload) {
        // Get the function from window object
        let onloadFunc = window[buttonOnload.split('(')[0]];
        if (typeof onloadFunc === 'function') {
            // Call the function with the payload
            result= onloadFunc(payload);
        }
    }
    let isDisabled=result;
    if(isDisabled==true){
        isDisabled="disabled"
    }
    else{
        isDisabled="enabled"
    }
                    inputElement = `<td data-label=${thName}  class="button"><button  ${isDisabled} onclick=${buttonClick}>${col.dbcolum}</button></td>`
     
    
  }catch(err){
        console.log('error',err)
    }
    
  
                }
                else if (dataType === 'date') {
                    const rawDate = row[col.dbcolum];
                    let formattedDate = '';
                    
                    if (rawDate) {
                        const dateObj = new Date(rawDate);
                        formattedDate = dateObj.toISOString().split('T')[0];  // Extract YYYY-MM-DD
                    }
                
                    inputElement = `<td data-label=${thName} name="${col.dbcolum}" data-name="${col.dbcolum}">${formattedDate}</td>`;
                }
                else if (dataType == 'icon') {
                    let callFunction = thElement.getAttribute('data-click');
                    let icon = thElement.getAttribute('data-icon');

                    inputElement=`<td data-label=${thName}><i class="${icon}" onclick="${callFunction}"></i></a></td>`
                    
                  
                }
                else if (dataType === 'embeddedPage') {
                    // Create a safe JSON string of the row data
                    const rowDataJson = JSON.stringify(row)
                    .replace(/"/g, '&quot;')  // Escape quotes for HTML attribute
                    .replace(/'/g, "\\'");    // Escape single quotes for JS string
          
                      // Generate a unique ID for this embedded page badge
    const uniqueId = `embedded-${col.dbcolum}-${rowIndex}`;
    
    // Store the column and row data for later count fetching
    columnsNeedingEmbeddedCounts.push({ 
        colName: col.dbcolum, 
        rowData: row,
        uniqueId,
        businessView: thElement.getAttribute('data-source'), // Get businessView from th attribute
        paramsMapping: thElement.getAttribute('data-params') // Get params mapping from th attribute
    });
                    inputElement = ` 
                        <td data-label=${thName}>
                            <div class="icon-container" onclick="handleEmbeddedPageClick('${rowDataJson}')">
                                <i class="fa fa-table" id="item-count">
                                                   <span class="badge" id="${uniqueId}-badge" style="display: none;">0</span>

                                </i>
                            </div>
                        </td>
                    `;
                }
                else if (dataType === 'checkbox') {
                    const buttonOnload = thElement.getAttribute('data-checkboxCondition');
                    let payload=row;
                    let result;
    // If there's an onload function, call it with the payload
    if (buttonOnload) {
       // Get the function from window object
       let onloadFunc = window[buttonOnload.split('(')[0]];
       if (typeof onloadFunc === 'function') {
           // Call the function with the payload
           result= onloadFunc(payload);
       }
   }
   let isDisabled=result;
   if(isDisabled==true){
       isDisabled="disabled"
   }
   else{
       isDisabled="enabled"
   }
                    return `<td><input type="checkbox" name="${col.dbcolum}" 
                            onchange="handleCheckboxChange(this, '${rowId}')" 
                            ${isDisabled} /></td>`;
                  }
                else if(dataType === 'table-collab') {
inputElement=`<td data-label=${thName}>
<div class="collaboration-icons">
<i class="fa-regular fa-comment"></i>   
<i class="fa-regular fa-file"></i>
<i onclick="getLog('VEND41')">&#x26A1;</i>   
<i onclick="getLog2('VEND42','workflow')">&#x26A1;</i>        
<i class="fa fa-info-circle" onclick="showRowDetails(${rowIndex})"></i></div>
</td>`                            }
                    else {
                    inputElement = `<td data-label=${thName} name="${col.dbcolum}" data-name="${col.dbcolum}">${row[col.dbcolum] || null}</td>`;
                }

                return inputElement;
            }).join('')}
        </tr>
    `}).join('');

    // Update pagination controls for this table
    updatePaginationControls(table.datasource, page, tableDataSourceResponse.count, limit);
 
    columnsNeedingBadges.forEach(({ colName, articleId, uniqueId }) => {
        fetch(`/getAttachments?articleId=${articleId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const count = data.attachments.length;
                    const badgeEl = document.getElementById(`${uniqueId}-badge`);
                    if (badgeEl) {
                        badgeEl.textContent = count;
                        badgeEl.style.display = count > 0 ? 'inline-block' : 'none';
                    }
                }
            })
            .catch(err => console.error('Failed to fetch attachments for', articleId, err));
    });
    // After the table is rendered, fetch counts for embedded pages
columnsNeedingEmbeddedCounts.forEach(({ colName, rowData, uniqueId, businessView, paramsMapping }) => {
    // Parse the params mapping (assuming format like "param1:rowField1,param2:rowField2")
    const params = {};
    console.log('paramsMapping',paramsMapping)
    if (paramsMapping) {
        paramsMapping.split(',').forEach(mapping => {
            const [paramName, rowField] = mapping.split(':');
            params[paramName] = rowData[rowField];
            
        });
    }

    fetch('/callAggregationBusinessView', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        
        body: JSON.stringify({
            businessView,
            params
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data) {
            console.log('count ',uniqueId)

            const count = data[0].count[0].count || 0; // Adjust based on your response structure
            const badgeEl = document.getElementById(`${uniqueId}-badge`);
            if (badgeEl) {
                badgeEl.textContent = count;
                badgeEl.style.display = count > 0 ? 'inline-block' : 'none';
            }
        }
        else{
            console.log('Failed to fetch embedded count');
        }
    })
    .catch(err => console.error('Failed to fetch embedded count', err));
});
    
}
        }
        calculateColumnTotals(tableId);

        
    });
            })
            .catch(error => console.error('Error:', error))
            .finally(() => {
                // Hide the loading spinner after the data is loaded or if an error occurs
                loadingSpinner.style.display = 'none';
            });
        }
    
        // Function to update pagination controls
        function updatePaginationControls(datasource, currentPage, totalCount, limit) {
            const totalPages = Math.ceil(totalCount / limit);
    
            // Find the pagination container for the specific datasource
            const paginationContainer = document
            .querySelector(`.table-container[datasource="${datasource}"]`)
            .closest('.collpase-container') // Move up to the parent container
            .querySelector('.pagination'); // Select the pagination container
            if (!paginationContainer) {
                console.error(`Pagination container not found for datasource: ${datasource}`);
                return;
            }
    
            let paginationHtml = '';
    
            if (currentPage > 1) {
                paginationHtml += `<button onclick="changePage('${datasource}', ${currentPage - 1})"><</button>`;
            }
    
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `<button onclick="changePage('${datasource}', ${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
            }
    
            if (currentPage < totalPages) {
                paginationHtml += `<button onclick="changePage('${datasource}', ${currentPage + 1})">></button>`;
            }
    
            paginationContainer.innerHTML = paginationHtml;
        }
    
        // Function to handle page changes
        window.changePage = function (datasource, page) {
        console.log('change page called',datasource,page)
            activeTableDatasource = datasource; // Set the active table
            loadData(page, rowsPerPage, datasource); // Fetch data for the specific table
        };
    
        // Function to handle rows per page changes
        window.changeRowsPerPage = function (limit,selectElement) {
            rowsPerPage = parseInt(limit, 10);
            currentPage = 1; // Reset to the first page
            let tableContainer = selectElement.closest(".pagination-controls").previousElementSibling;
            
            // Get the datasource attribute
            let dataSource = tableContainer.getAttribute("datasource");
    
            if (dataSource) {
                // Fetch data for the active table only
                 console.log('change row if block',)
                loadData(currentPage, rowsPerPage, dataSource);
            } else {
                // Fetch data for all tables (initial load)
                console.log('change row else block')
    
                loadData(currentPage, rowsPerPage);
            }
        };
    
let count=0;
        // function calculateColumnTotals() {
        //     const table = document.getElementById('categories');
        //     const tbody = table.querySelector('tbody');
        //     const tfoot = table.querySelector('tfoot');
         

        //     // Get all data rows (sk
        //     // ip header)
        //     const rows = tbody.querySelectorAll('tr');
            
        //     // Initialize totals object
        //     const totals = {};
        //     console.log('total function called',rows,count)
        //     // Loop through each row
        //     try {
        //         rows.forEach(row => {
        //             const cells = row.querySelectorAll('td');
                 
            
        //             cells.forEach((cell, index) => {
        //                 // Check if cell has data-type="number" or contains numeric data
        //                 const isNumber = cell.getAttribute('data-type') === 'number' || 
        //                                 !isNaN(parseFloat(cell.textContent));
                        
        //                 if (isNumber) {
        //                     count++
        //                     const value = parseFloat(cell.textContent) || 0;
                            
        //                     // Initialize total for this column if not exists
        //                     if (!totals[index]) totals[index] = 0;
                            
        //                     // Add to total
        //                     totals[index] += value;
        //                 }
        //             });
        //             console.log('total functionrow called',totals)

        //         });
        
        //         // Update footer cells with totals
        //     const footerCells = tfoot.querySelectorAll('td');
        //     Object.keys(totals).forEach(colIndex => {
        //         const index = parseInt(colIndex);
        //         if (footerCells[index]) {
        //             console.log('totals',totals[index])
        //             footerCells[index].textContent = totals[index].toFixed(2);
        //         }
        //     });
        //     } catch (error) {
        //         console.error("Error calculating totals:", error);
        //     }
           
            
        
        // }
        // function calculateColumnTotals() {
        //     const table = document.getElementById('categories');
        //     const tbody = table.querySelector('tbody');
        //     const tfoot = table.querySelector('tfoot');
        //     if (!tbody || !tfoot) return; // Exit if elements not found
        
        //     // Get all data rows
        //     const rows = tbody.querySelectorAll('tr');
        //     let sequenceTotal = 0;
        
        //     // Find which column has data-type="number" (Sequence column)
        //     const headers = table.querySelectorAll('thead th');
        //     let sequenceColumnIndex = -1;
            
        //     headers.forEach((header, index) => {
        //         if (header.getAttribute('data-type') === 'number') {
        //             sequenceColumnIndex = index;
        //         }
        //     });
        
        //     // If no numeric column found, exit
        //     if (sequenceColumnIndex === -1) return;
        
        //     // Calculate total for the sequence column
        //     rows.forEach(row => {
        //         const cells = row.querySelectorAll('td');
        //         if (cells.length > sequenceColumnIndex) {
        //             const cell = cells[sequenceColumnIndex];
        //             const value = parseFloat(cell.textContent) || 0;
        //             sequenceTotal += value;
        //             console.log(sequenceTotal)
        
        //         }
        //     });
        
        //     // Update the footer cell for the sequence column
        //     const footerCells = tfoot.querySelectorAll('td');
        //     if (footerCells.length > sequenceColumnIndex) {
        //         console.log('final sequence total',sequenceTotal)
        //         footerCells[sequenceColumnIndex].textContent = sequenceTotal.toFixed(2);
        //     }

            
        // }
        // function calculateColumnTotals() {
        //     console.log('--- Starting calculateColumnTotals ---');
            
        //     const table = document.getElementById('categories');
        //     if (!table) {
        //         console.error('Table not found');
        //         return;
        //     }
        
        //     const tbody = table.querySelector('tbody');
        //     const tfoot = table.querySelector('tfoot');
        //     if (!tbody || !tfoot) {
        //         console.error('tbody or tfoot not found');
        //         return;
        //     }
        
        //     const rows = tbody.querySelectorAll('tr');
        //     console.log('Found rows:', rows.length);
        //     if (rows.length === 0) {
        //         console.log('No data rows found');
        //         return;
        //     }
        
        //     const headers = table.querySelectorAll('thead th');
        //     let sequenceColumnIndex = -1;
            
        //     headers.forEach((header, index) => {
        //         if (header.getAttribute('data-type') === 'number') {
        //             sequenceColumnIndex = index;
        //         }
        //     });
        
        //     console.log('Sequence column index:', sequenceColumnIndex);
        //     if (sequenceColumnIndex === -1) {
        //         console.log('No numeric column found');
        //         return;
        //     }
        
        //     let sequenceTotal = 0;
        //     rows.forEach(row => {
        //         const cells = row.querySelectorAll('td');
        //         if (cells.length > sequenceColumnIndex) {
        //             const cell = cells[sequenceColumnIndex];
        //             const value = parseFloat(cell.textContent) || 0;
        //             console.log('Adding value:', value, 'from cell:', cell.textContent);
        //             sequenceTotal += value;
        //         }
        //     });
        
        //     console.log('Final sequence total:', sequenceTotal);
            
        //     const footerCells = tfoot.querySelectorAll('td');
        //     console.log('Footer cells:', footerCells.length);
            
        //     if (footerCells.length > sequenceColumnIndex) {
        //         footerCells[sequenceColumnIndex].textContent = sequenceTotal.toFixed(2);
        //         console.log('Updated footer cell at index', sequenceColumnIndex);
        //     } else {
        //         console.error('Footer doesnt have enough cells');
        //     }
            
        //     console.log('--- Ending calculateColumnTotals ---');
        // }
        
        function calculateColumnTotals(tableId) {
            // console.log('--- Starting calculateColumnTotals ---',tableId);
            
            const table = document.getElementById(tableId);
            if (!table) {
                console.error('Table not found');
                return;
            }
        
            const tbody = table.querySelector('tbody');
            const tfoot = table.querySelector('tfoot');
            if (!tbody || !tfoot) {
                console.error('tbody or tfoot not found');
                return;
            }
        
            const rows = tbody.querySelectorAll('tr');
            console.log('Found rows:', rows.length);
            if (rows.length === 0) {
                console.log('No data rows found');
                return;
            }
        
            const headers = table.querySelectorAll('thead th');
            let sequenceColumnIndex = -1;
            
            headers.forEach((header, index) => {
                if (header.getAttribute('data-type') === 'number') {
                    sequenceColumnIndex = index;
                }
            });
        
            console.log('Sequence column index:', sequenceColumnIndex);
            if (sequenceColumnIndex === -1) {
                console.log('No numeric column found');
                return;
            }
        
            let sequenceTotal = 0;
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > sequenceColumnIndex) {
                    const cell = cells[sequenceColumnIndex];
                    const value = parseFloat(cell.textContent) || 0;
                    console.log('Adding value:', value, 'from cell:', cell.textContent);
                    sequenceTotal += value;
                }
            });
        
            console.log('Final sequence total:', sequenceTotal);
            
            const footerCells = tfoot.querySelectorAll('td');
            console.log('Footer cells:', footerCells.length);
            
            if (footerCells.length > sequenceColumnIndex) {
                footerCells[sequenceColumnIndex].textContent = sequenceTotal.toFixed(2);
                console.log('Updated footer cell at index', sequenceColumnIndex);
            } else {
                console.error('Footer doesnt have enough cells');
            }
            
            console.log('--- Ending calculateColumnTotals ---');
        }


        











        