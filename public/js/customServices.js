function getStates(data) {
    console.log('get state called', data.value)

    fetch('/callAggregationBusinessView', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessView: 'getStates',
            code: data.value
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            // Using CSS.escape() for the parent ID
            const parentId = '2';
            const stateSelect = document.querySelector(`#${CSS.escape(parentId)} #state`);

            console.log('state field', stateSelect)
            console.log('get states response:', data);
            const states = data[0].results;
            stateSelect.innerHTML = ''

            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state._id; // Country code
                option.textContent = state.test; // Country name
                stateSelect.appendChild(option);
            });

        })
        .catch((error) => {
            console.error('Error states:', error);
        });
}



function callQuery() {
    fetch('/callAggregationBusinessView', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessView: 'getCountries'
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Response from server:', data);
            const countrySelect = document.getElementById('country');

            // Assuming 'data' is an array with an object that has a 'results' array
            const countries = data[0].results;

            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country._id; // Country code
                option.textContent = country.test; // Country name
                countrySelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error submitting form:', error);
        });
}
