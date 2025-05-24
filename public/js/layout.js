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






function addRow(tableId) {
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
    
    checkTableForEmptyData(tableId)

}

function deleteRow(button) {
    const row = button.closest('tr'); // Find the closest <tr> element
    row.remove(); // Remove the row from the table
}



function markRequiredFields() {
    // const form = document.getElementById(formId);
    console.log('required')

    const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');

    requiredFields.forEach(field => {
        const label = document.querySelector(`label[for="${field.name}"]`);
        const th = field.closest('table')?.querySelector(`th:nth-child(${field.closest('td').cellIndex + 1})`);
        if (th && !th.querySelector('.required')) {
            const asterisk = document.createElement('span');
            asterisk.textContent = ' *';
            asterisk.style.color = 'red';
            asterisk.classList.add('required');
            th.appendChild(asterisk);
        }
        if (label) {
            const asterisk = document.createElement('span');
            asterisk.textContent = ' *';
            asterisk.style.color = 'red';

            asterisk.classList.add('required'); // Adds the CSS class for styling
            label.appendChild(asterisk);
        }
    });


}

function initMenus(){
    const sidebar = document.getElementById("sidebar").querySelector("ul");
    // const role = getCookie('userRole'); // Retrieve role from cookies, if necessary

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

    // Check for cached menu data
    const cachedMenus = JSON.parse(sessionStorage.getItem('cachedMenus'));
    const cacheTimestamp = sessionStorage.getItem('cacheTimestamp');
    const cacheDuration = 60 * 60 * 1000; // Cache duration: 1 hour

    if (cachedMenus && cacheTimestamp && (Date.now() - cacheTimestamp < cacheDuration)) {
        // Load menus from cache if available and not expired
        loadMenus(cachedMenus);
    } else {
        // Fetch menu data from API with custom headers and store it in sessionStorage
        fetch('/permission', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
                'Role': 'admin',
                'User':decodeToken.user
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('data',data)
            const menus = data.menus;

            // Cache the menu data and timestamp
            sessionStorage.setItem('cachedMenus', JSON.stringify(menus));
            sessionStorage.setItem('cacheTimestamp', Date.now().toString());

            // Load menus from the fetched data
            loadMenus(menus);
        })
        .catch(error => console.error("Error fetching menu data:", error));
    }

    // Function to dynamically create the sidebar menu items
 function loadMenus(menus) {
    sidebar.innerHTML = ''; // Clear any existing menu items

    menus.forEach(menu => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = menu.url || "javascript:void(0)";

        // Create icon element
        const iconElem = document.createElement("i");
        if (menu.icon) {
            const iconClasses = menu.icon.split(" ");
            iconElem.classList.add(...iconClasses);
        } else {
            // Default icon if none provided
            iconElem.classList.add("fa", "fa-truck");
        }

        // Create menu name span
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("menuname");
        nameSpan.textContent = menu.name;

        link.appendChild(iconElem);
        link.appendChild(nameSpan);

        if (menu.subMenus && menu.subMenus.length > 0) {
            link.href = "javascript:void(0)";
            
            // Add arrow span
            const arrowSpan = document.createElement("span");
            arrowSpan.classList.add("arrow");
            arrowSpan.textContent = ">";
            link.appendChild(arrowSpan);

            li.appendChild(link);

            const subMenu = document.createElement("ul");
            subMenu.classList.add("submenu");  // Changed from "menuname" to "submenu"
            subMenu.style.display = "none";

            menu.subMenus.forEach(sub => {
                const subLi = document.createElement("li");
                const subLink = document.createElement("a");
                
                // Create icon for submenu item
                const subIcon = document.createElement("i");
                if (sub.icon) {
                    const subIconClasses = sub.icon.split(" ");
                    subIcon.classList.add(...subIconClasses);
                } else {
                    subIcon.classList.add("fa", "fa-truck");
                }
                
                // Create name span for submenu item
                const subNameSpan = document.createElement("span");
                subNameSpan.classList.add("menuname");
                subNameSpan.textContent = sub.name;
                
                subLink.href = sub.url;
                subLink.appendChild(subIcon);
                subLink.appendChild(subNameSpan);
                
                subLi.appendChild(subLink);
                subMenu.appendChild(subLi);
            });

            li.appendChild(subMenu);

         

              // Toggle submenu visibility on arrow click
            arrowSpan.addEventListener("click", function(e) {
                e.stopPropagation(); // Prevent the parent link's click event
                toggleSubMenu(subMenu, arrowSpan);
            });
            
            // Toggle submenu visibility on main menu link click
            link.addEventListener("click", function(e) {
                e.preventDefault();
                toggleSubMenu(subMenu, arrowSpan);
            });
            
        } else {
            li.appendChild(link);
        }

        sidebar.appendChild(li);
    });
}

// Helper function to toggle submenu
function toggleSubMenu(subMenu, arrowSpan) {
    subMenu.style.display = subMenu.style.display === "none" ? "block" : "none";
    if (arrowSpan) {
        arrowSpan.classList.toggle("open");
    }
}
}