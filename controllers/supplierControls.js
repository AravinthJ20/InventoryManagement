const jwt=require('jsonwebtoken')
const dotenv=require('dotenv')
const {connectDB}=require('../config/db.js')
const primary=require('../controllers/keyGenerator.js')
const path=require('path')
const axios=require('axios')
const bcrypt=require('bcrypt')
const {generatePrimaryId} =require('./utils.js')

require('dotenv').config()


    const signup=async (req,res)=>{
            let client=await connectDB("InventoryMangement");

            const collection=client.collection('Users')
            const data=req.body
            let {user,contact,email}=req.body
            console.log(req.body,'user')
       let userid;
              let primaryName="userId"
    let  primaryPrefix="U"
          
               bcrypt.genSalt(10,(err,salt)=>{
              bcrypt.hash(req.body.password,salt,async function (err,hashedPassword){
              const password=hashedPassword
               userid=await  generatePrimaryId(primaryName,primaryPrefix)

              await collection.insertOne({user:user,userid:userid,password:password,email:email,contact:contact })
        
              let msg=`"your user  id":${userid}`
              res.status(200).render("tooltip",{msg})
              })
           
              
               })
              
           
           
         
           
           }


           module.exports={
            signup
           }