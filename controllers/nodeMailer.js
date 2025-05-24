const express = require('express');
const nodemailer = require('nodemailer');
 const path=require('path')
const fs = require('fs');
const jwt=require('jsonwebtoken')

const bcrypt=require('bcrypt')
const session = require('express-session');
const dbo=require('../config/db.js')
const securePassword=require('../controllers/control.js')
require('dotenv').config()

const accountSid=process.env.TWILIO_ACCOUNT_SID
const authToken=process.env.TWILIO_AUTH_TOKEN
const client=require('twilio')(accountSid,authToken)
const SMS=(TO_NUMBER,body)=>{
    let msgOptions={

        from:process.env.TWILIO_FROM_NUMBER,
        to:TO_NUMBER,
        body
        
    }
    try{
        const message= client.messages.create(msgOptions);
        console.log('message sent')
    }
    catch(error){
console.log(error)
    }
}
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  const otps={};


  

// Handle form submission
const sendEmail=async (req, res) => {
    console.log(req.body)
    const {recipientEmail, subject } = req.body;
    const otp=generateOTP()
    const client=await dbo.connectDB("InventoryMangement")
    const collection=client.collection('Users')
   securePassword.securePassword(otp).then(async (data)=>{

    const timestamp = Date.now(); // Get the current timestamp

    await collection.updateOne({email:recipientEmail},{$set:{token:data,tokenSession:Date.now(), tokenSession: timestamp}})
   }).then(result=>console.log('data updated')).catch((err)=>{console.log(err)})
   
    // 
    // otps[recipientEmail]=otp;
   let senderEmail='aravinth.j@eimsolutions.com'
    // Read the HTML template file
    // const filepath = path.join(__dirname + 'public','emailTemplate.html')
    fs.readFile(path.join(__dirname, '../public/html/emailTemplate2.html'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading template file:', err);
            res.status(500).send('Error sending email');
            return;
        }

        // Replace placeholders in the template with actual data
        const htmlContent = data.replace('{{ name }}', otp)
                                   .replace('{{ user }}', 'user');

        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'aravinth.j388@gmail.com', // Your Gmail email address
                pass: 'mqhy prue yqdn djep' // Your App Password generated from Google
            }
        });

        // Email options
        const mailOptions = {
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            html: htmlContent // Use HTML content for the email body
        };

        // Send email
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.error('Error occurred:', error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent:', info.response);
                console.log('your otp is:',otp)
                // res.status(200).send('Email sent successfully');
                // res.status(200).render('validateOTP',{recipientEmail});
                res.json({ success: true, message: 'OTP sent successfully' });

            }
        });


        
    });
    const userData=await collection.findOne({email:recipientEmail})
    const usermobile='+919344968641'
    // SMS(usermobile,`Your OTP is ${otp}`)

};
const verifyOTP=async (req,res)=>{
    const client=await dbo.connectDB("InventoryMangement")
    const collection=client.collection('Users')
    const {recipientEmail,otp}=req.body
    const userData=await collection.findOne({email:recipientEmail})
    const validPassword=await bcrypt.compare(otp.toString(),userData.token)
''
const currentTime = Date.now();
const otpGenerationTime = userData.tokenSession; // Timestamp when the OTP was generated
const otpExpiryTime = 30 * 1000; // OTP valid for 5 minutes

const payload = { email:recipientEmail}
const token = jwt.sign(payload, "dadasdq#r@#$@#redfetq#$r%$#@rfds@!#!#3@@!#!@", {
    expiresIn: "1h",
})



// Check if the OTP is valid and if it's not expired
if (!validPassword || (currentTime - otpGenerationTime > otpExpiryTime)) {
    return res.status(400).send('Invalid or expired OTP');
}

// if(!validPassword){
//     res.status(400).send('invalid otp')
// }
else{
console.log(otps[recipientEmail])
// res.status(200).send('otp verified')
// res.status(200).render('PasswordReset2',{recipientEmail})
// res.sendFile(path.join(__dirname, '../views/PasswordReset2.html'))

return res.json({success:true,token:token});

}
}
module.exports={sendemail:sendEmail,
    verifyOTP:verifyOTP}
