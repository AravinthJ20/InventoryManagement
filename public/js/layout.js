function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');

    const mainContent = document.querySelector('.main-content');
    mainContent.classList.toggle('shifted'); // Add this class when sidebar is active

}

function enableSubmenus(){ document.querySelectorAll('.sidebar ul li > a').forEach(function(mainMenu) {
    mainMenu.addEventListener('click', function() {
        var submenu = this.nextElementSibling;
        var arrow = this.querySelector('.arrow');

        if (submenu.style.display === 'block') {
            submenu.style.display = 'none';
            arrow.classList.remove('open');
        } else {
            submenu.style.display = 'block';
            arrow.classList.add('open');
        }
    });
});
}

function toggleSidebar2() {
    var sidebar = document.getElementById('sidebar');
   
        sidebar.classList.toggle('active');
    

    const mainContent = document.querySelector('.main-content');
    mainContent.classList.toggle('shifted'); // Add this class when sidebar is active

}






function addRow() {
    const medicineTable = document.getElementById("addrowtest").getElementsByTagName('tbody')[0];

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
         
                <td><input type="text" name="address"> </td>
                <td><input type="text" name="country"></td>
    
                <td><input type="text" name="state"></td>
                <td><input type="text" name="district"></td>
                <td><input type="text" name="city"></td>
                <td><input type="text" name="postalCode" required></td>

                
                <td><button class="deleteRowBtn" onclick=" deleteRow(this);">-</button></td>

    `;
    medicineTable.appendChild(newRow);
    newRow.querySelector('.deleteRowBtn').addEventListener('click', function() {
        deleteRow(this);
    });
}

function deleteRow(button) {
    const row = button.closest('tr'); // Find the closest <tr> element
    row.remove(); // Remove the row from the table
}