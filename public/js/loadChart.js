  // Function to fetch data from /fetchPageData2
  async function fetchChartData() {
    try {
        const response = await fetch('/fetchPageData2'); // Fetch data from the endpoint
        const data = await response.json(); // Parse the JSON response

        // Extract chart data from the response
        if (data.items && data.items[0].chartData) {
            // Reset chartData
            chartData = {};

            // Dynamically populate chartData based on the response
            data.items[0].chartData.forEach(item => {
                chartData[item.x] = item.y; // Add status and count to chartData
            });
        }

        // Initialize or update the chart
        initChart();
    } catch (error) {
        console.error('Error fetching chart data:', error);
    }
}

// Initialize the chart


function initChart() {
    if (myChart) {
        myChart.destroy(); // Destroy existing chart instance if it exists
    }

    // Dynamically generate background and border colors based on the number of statuses
    const backgroundColors = Object.keys(chartData).map((_, index) => {
        const hue = (index * 50) % 360; // Generate a unique hue for each status
        return `hsla(${hue}, 70%, 50%, 0.2)`; // Light color for background
    });

    const borderColors = Object.keys(chartData).map((_, index) => {
        const hue = (index * 50) % 360; // Generate a unique hue for each status
        return `hsla(${hue}, 70%, 50%, 1)`; // Darker color for border
    });

    myChart = new Chart(ctx, {
        type: 'bar', // Default type
        data: {
            labels: Object.keys(chartData), // Dynamic labels based on statuses
            datasets: [{
                label: 'Status Count',
                data: Object.values(chartData), // Dynamic data based on counts
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        },
        onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const clickedIndex = elements[0].index; // Get the index of the clicked bar
                        const clickedStatus = Object.keys(chartData)[clickedIndex]; // Get the status label
                        filterByStatus(clickedStatus); // Filter data based on the clicked status
                    }
                }
    });


 
}

// Function to update chart type
function updateChart() {
    const chartType = document.getElementById('chartTypeSelect').value;
    myChart.config.type = chartType;
    myChart.update();
}

// Function to toggle chart visibility
function toggleChart(id) {
    const chart = document.getElementById(id);
    const header = document.querySelector('.collapse-btn');
    chart.style.display = (chart.style.display === 'none') ? 'block' : 'none';
    header.classList.toggle('collapsed');
}
function filterByStatus(data){
        console.log(status)
    }
