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


function initChartold() {
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
function initChart() {
    if (myChart) {
        myChart.destroy(); // Destroy existing chart instance if it exists
    }

    const chartType = document.getElementById('chartTypeSelect')?.value || 'bar';
    const labels = Object.keys(chartData);
    const values = Object.values(chartData);

    const backgroundColors = labels.map((_, i) => `hsla(${(i * 50) % 360}, 70%, 60%, 0.6)`);
    const borderColors = labels.map((_, i) => `hsla(${(i * 50) % 360}, 70%, 40%, 1)`);

    const baseDataset = {
        label: 'Status Count',
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        tension: 0.4, // Smooth line for line/radar
        fill: chartType === 'radar' || chartType === 'line' ? true : false, // fill area for line/radar
        pointBackgroundColor: chartType === 'line' ? borderColors : undefined,
        pointRadius: chartType === 'line' ? 5 : 0
    };

    const chartOptions = {
        responsive: true,
        plugins: {
           legend: {
        display: true,
        position: 'right',
        labels: {
            color: '#333',
            margin: 10,

            font: {
                size: 12,
                family: 'Arial'
            }
        }
    },
            tooltip: {
                backgroundColor: '#333',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#aaa',
                borderWidth: 1
            }
        },
     // Disable grid lines for bar/line charts
    scales: (chartType === 'bar' || chartType === 'line') ? {
        x: {
            grid: {
                display: false // ⛔ Hide X-axis grid lines
            },
            ticks: {
                color: '#333'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                display: false // ⛔ Hide Y-axis grid lines
            },
            ticks: {
                color: '#333'
            }
        }
    } : {},
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const clickedIndex = elements[0].index;
                const clickedStatus = labels[clickedIndex];
                filterByStatus(clickedStatus);
            }
        }
    };

    myChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels,
            datasets: [baseDataset]
        },
        options: chartOptions
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
