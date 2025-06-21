const path=require('path')

const express = require('express')
const router = express.Router()
const user=require('../controllers/supplierControls')
const {sendemail,verifyOTP}=require('../controllers/nodeMailer')
const masterRoutes=require('../controllers/master.js')

router.get('/forgotPassword',(req,res)=>{
  // res.sendFile(path.join(__dirname,'views','PasswordReset.html'))
res.render("PasswordReset")
}).post('/forgotPassword',sendemail)
router.post('/verifyOTP',verifyOTP)
router.post('/setPassword',masterRoutes.setPassword)
module.exports = router