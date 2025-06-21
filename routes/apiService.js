const express = require('express')
const router = express.Router()
const user=require('../controllers/supplierControls')
const XLSX = require('xlsx');
const api=require('./api')


router.post('/api/sendEmail2',api.sendemail3)


module.exports = router