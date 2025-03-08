const express = require('express');
const nodemailer = require('nodemailer');
 const path=require('path')
const fs = require('fs');
const bcrypt=require('bcrypt')
const dbo=require('../config/db.js')
const Handlebars = require('handlebars');


// Handle form submission
const sendEmail=async (req, res) => {
    console.log(req.body)
    const {recipientEmail, subject } = req.body;
    const otp=generateOTP()
    const client=await dbo.connectDatabase()
    const collection=client.collection('user')
   securePassword.securePassword(otp).then(async (data)=>{

    const timestamp = Date.now(); // Get the current timestamp

    await collection.updateOne({email:recipientEmail},{$set:{token:data,tokenSession:Date.now(), tokenSession: timestamp}})
   }).then(result=>console.log('data updated')).catch((err)=>{console.log(err)})
   
    // 
    // otps[recipientEmail]=otp;
   let senderEmail='aravinth.j@eimsolutions.com'
    // Read the HTML template file
    // const filepath = path.join(__dirname + 'public','emailTemplate.html')
    fs.readFile('public/emailTemplate2.html', 'utf8', (err, data) => {
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
                user: 'aravinth.j@eimsolutions.com', // Your Gmail email address
                pass: 'hrcn lfyg sxpb oqzo' // Your App Password generated from Google
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
                res.status(200).render('validateOTP',{recipientEmail});

            }
        });
    });
};
const verifyOTP=async (req,res)=>{
    const client=await dbo.connectDatabase()
    const collection=client.collection('user')
    const {recipientEmail,otp}=req.body
    const userData=await collection.findOne({email:recipientEmail})
    const validPassword=await bcrypt.compare(otp.toString(),userData.token)
''
const currentTime = Date.now();
const otpGenerationTime = userData.tokenSession; // Timestamp when the OTP was generated
const otpExpiryTime = 30 * 1000; // OTP valid for 5 minutes

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
res.status(200).render('PasswordReset2',{recipientEmail})
}
}
const sendEmail2=async (req, res) => {
    console.log(req.body)
    const {recipientEmail, subject } = req.body;
 
    // 
    // otps[recipientEmail]=otp;
   let senderEmail='aravinth.j388@gmail.com'
    // Read the HTML template file
    // const filepath = path.join(__dirname + 'public','emailTemplate.html')
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
        subject: "hello",
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
            res.status(200).render('validateOTP',{recipientEmail});

        }
    });
};


const sendEmail3 = async (req, res) => {
    try {
        // Extract data from the request body
        const {
            recipientEmail,
            subject,
            templateValue,
            schlogo,
            userName,
            emailBody1,
            emailBody2,
            footer2,
            remarks
        } = req.body;

        const senderEmail = 'aravinth.j388@gmail.com';
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: senderEmail,
                pass: 'mqhy prue yqdn djep' // Your App Password
            }
        });

        // Read and compile the HTML template
        const templatePath = path.join(__dirname, '../public/html/ ', 'emailTemplate.html');
        const htmlTemplate = fs.readFileSync(templatePath, 'utf8');
        const compiledTemplate = Handlebars.compile(htmlTemplate);

        // Populate the template with dynamic data
        const htmlContent = compiledTemplate({
            subject,
            schlogo,
            userName,
            emailBody1,
            emailBody2,
            footer2,
            remarks,
            templateValue
        });

        // Email options
        const mailOptions = {
            from: senderEmail,
            to: recipientEmail,
            subject: subject,
            html: htmlContent
        };

        // Send the email
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error('Error occurred:', error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent:', info.response);
                res.status(200).send('Email sent successfully');
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports={sendemail:sendEmail,
    verifyOTP:verifyOTP,sendemail3:sendEmail3}
