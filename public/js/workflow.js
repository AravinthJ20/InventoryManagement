function fetchApprovalLevels() {
    // Example data, replace this with a real API call
    return [
        { id: 'START', user: 'L1 [L1 ID]', status: 'Inbound Shipment', timestamp: '10/16/24, 11:09 AM', class: 'start' },
        { id: 'SK', user: 'L2 [L2 ID]', status: 'Submitted', timestamp: '10/16/24, 11:09 AM', class: 'submitted' },
        { id: 'SD', user: 'L3 [L3 ID]', status: 'Approved', timestamp: '10/16/24, 11:09 AM', class: 'approved' },
        { id: 'SD', user: 'L4 [L4 ID]', status: 'Approved', timestamp: '10/16/24, 11:09 AM', class: 'approved' },
        { id: 'END', user: 'SYSTEM [SYSTEM]', status: 'Completion', timestamp: '10/16/24, 11:09 AM', class: 'end' }
    ];
}
async function renderWorkflowSteps(steps, id) {
    const workflowLog = document.getElementById('workflowLog');
    workflowLog.innerHTML = ''; // Clear existing content
    steps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'workflow-step';

        const stepHeader = document.createElement('div');
        stepHeader.className = 'step-header';
        stepHeader.innerHTML = `
            <div class="step-icon ${step.class}">${step.id}</div>
            <div class="step-info">
                <h4>${step.user}</h4>
                <p>Status: ${step.status}</p>
                <span>${step.timestamp}</span>
            </div>
        `;

        const stepDetails = document.createElement('div');
        stepDetails.className = 'step-details';
        stepDetails.innerHTML = 'Additional step details can be provided here.';

        stepDiv.appendChild(stepHeader);
        stepDiv.appendChild(stepDetails);

        workflowLog.appendChild(stepDiv);
    });




}
// Initialize workflow log
function getlog(id) {
    const approvalLevels = fetchApprovalLevels(); // Fetch levels

    console.log('workflow for', id)

    let test = document.getElementById('wfsidebar')
    test.style.display = (test.style.display === 'none') ? 'grid' : 'none';
    renderWorkflowSteps(approvalLevels, id); // Render levels
};
function closeWf() {
    let test = document.getElementById('wfsidebar')
    test.style.display = 'none';
}
