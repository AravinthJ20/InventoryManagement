//..attachment services ..//

  // Open the popup modal
  function openUploadPopup(fieldId) {
    // Store the current field ID in a global variable for later use
    currentFieldId = fieldId;
    document.getElementById("uploadPopup").style.display = "flex";
}

  // Close the popup modal
  function closeUploadPopup() {
    document.getElementById("uploadPopup").style.display = "none";
    resetFilePreview(); // Reset file preview on close
}


 // Handle file selection
 function handleFileSelection(event) {
    const files = event.target.files;
    const filePreview = document.getElementById("filePreview");

    // Add selected files to the appropriate field's attachments array and display them
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!attachments[currentFieldId]) {
            attachments[currentFieldId] = [];
        }
        attachments[currentFieldId].push(file);

        // Create file preview element
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        // Create download link for the file
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(file); // Generate object URL for the file
        downloadLink.textContent = "Download";
        downloadLink.onclick = (e) => {
            e.preventDefault();
            // Trigger download by creating an anchor element and simulating a click
            const a = document.createElement("a");
            a.href = URL.createObjectURL(file); // Object URL to download the file
            a.download = file.name; // Set the file name for the download
            a.click(); // Trigger the download
        };

        // Append download link to the file preview element
        fileItem.appendChild(downloadLink);

        // Create remove button for each file
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.onclick = () => removeFile(file, fileItem);

        fileItem.appendChild(removeButton);
        filePreview.appendChild(fileItem);
    }

    // Reset the input so the user can select a file again
    event.target.value = ''; // This resets the file input
}



// Remove file from the array and update the preview
function removeFile(file, fileItem) {
    // Remove from attachments array for the current field
    const fieldId = currentFieldId;
    const index = attachments[fieldId].indexOf(file);
    if (index > -1) {
        attachments[fieldId].splice(index, 1);
    }

    // Remove file preview
    fileItem.remove();
}

// Reset file preview
function resetFilePreview() {
    const filePreview = document.getElementById("filePreview");
    filePreview.innerHTML = ""; // Clear all file previews
}


 // Submit files
 function submitAttachments() {
    if (attachments[currentFieldId] && attachments[currentFieldId].length === 0) {
        alert("No files selected!");
        return;
    }

    const formData = new FormData();
    attachments[currentFieldId].forEach((file) => {
        formData.append("attachments", file);
    });

    // Submit the form data via Fetch API
    fetch("/uploadAttachments", {
        method: "POST",
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Store the articleId after the first successful upload
                articleIds[currentFieldId] = data.articleId;
                attachmentCounts[currentFieldId] = data.files.length; // Update attachment count
                  // Update the badge
        const badge = document.getElementById(`${currentFieldId}-badge`);
        if (badge) {
            badge.textContent = attachmentCounts[currentFieldId];
            badge.style.display = attachmentCounts[currentFieldId] > 0 ? 'block' : 'none';
        }
                const relatedInput = document.querySelector(`input[id="${currentFieldId}-article"]`);
                relatedInput.value = data.articleId; // Update the hidden input value
                alert("Files uploaded successfully!");
                closeUploadPopup(); // Close the popup after successful upload
                resetFilePreview(); // Reset the preview after successful upload
            } else {
                alert("Error uploading files.");
            }
        })
        .catch((error) => {
            console.error("Error uploading files:", error);
            alert("Error uploading files.");
        });
}
function updateBadge(fieldId) {
const badge = document.getElementById(`${fieldId}-badge`);
if (badge) {
    badge.textContent = attachmentCounts[fieldId] || 0;
    badge.style.display = (attachmentCounts[fieldId] > 0) ? 'block' : 'none';
    console.log('badge if block called')

}
else{
    console.log('badge else block called')
}
}


function fetchAttachments(articleId, fieldId) {
    fetch(`/getAttachments?articleId=${articleId}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                attachmentCounts[fieldId] = data.attachments.length;
                updateBadge(fieldId);
                displayFetchedAttachments(data.attachments, fieldId);
            } else {
                attachmentCounts[fieldId] = 0;
                updateBadge(fieldId);
                alert("No previous attachments found.");
            }
        })
        .catch((error) => {
            console.error("Error fetching attachments:", error);
            attachmentCounts[fieldId] = 0;
            updateBadge(fieldId);
            alert("Error fetching attachments.");
        });
}
    
function displayFetchedAttachments(files, fieldId) {
    const filePreview = document.getElementById("filePreview");
    files.forEach((file) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.textContent = `${file.originalName} (${(file.fileSize / 1024).toFixed(2)} KB)`;
        // Create download link for the fetched file
        const downloadLink = document.createElement("a");

        // Ensure fileUrl is valid (coming from server response)
        if (file.filePath) {
            downloadLink.href = file.filePath; // The URL where the file can be downloaded
            downloadLink.textContent = "Download";
            downloadLink.target = "_blank"; // Open the file in a new tab
            downloadLink.download = file.originalName;
            fileItem.appendChild(downloadLink);
        } else {
            console.error("File URL is missing for", file.originalName);
            fileItem.textContent += " (Download link not available)";
        }

        filePreview.appendChild(fileItem);
    });
    openUploadPopup(fieldId);
}


//..end attachment services ..//