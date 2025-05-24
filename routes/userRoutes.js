const express = require('express')
const router = express.Router()
const user=require('../controllers/supplierControls')
const XLSX = require('xlsx');


router.get('/Register',(req,res)=>{ res.render('SignUp')})

router.post('/signup',user.signup)

router.get('/checkSession', (req, res) => {
    if (req.session.admintoken) {
        return res.status(200).json({ status: "Session active" });
    } else {
        return res.status(401).json({ error: "Session expired" });
    }
});

router.post('/downloadExcel', (req, res) => {
    try {
        const tableData = req.body.tableData;

        // Convert tableData to Excel workbook
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(tableData);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Medicine Data');

        // Write Excel file to a buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send the Excel file as a download
        res.set('Content-Disposition', 'attachment; filename="medicine_data.xlsx"');
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    } catch (err) {
        console.error('Error generating and sending Excel file:', err);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router