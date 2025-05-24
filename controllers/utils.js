const express = require('express');
 const path=require('path')
const fs = require('fs');
const {connectDB}=require('../config/db.js')

async function generatePrimaryId(primaryName, primaryPrefix) {
    try {
        let db=await connectDB("InventoryMangement");
        let collection=db.collection('sequence')
        let prefix=primaryPrefix
        let sequenceCount=await collection.findOne({"sequnceId":primaryName})
        console.log('sequenceCount',sequenceCount)
        let count = sequenceCount?.sequence || 0;
        console.log('Initial count:', count);
  
  let countcheck=parseInt(count)>0;
  console.log(countcheck)
  count=parseInt(count)
  count = count > 0 ? count + 1 : 1;
  
        console.log('count3',count)
  
     const data=await collection.updateOne({"sequnceId":primaryName},{$set:{sequence:count}},{upsert:true})
     console.log('res',data)
  
     return prefix+count;
      
    }catch(err){
      console.log(err)
    }
  }

  module.exports={
    generatePrimaryId:generatePrimaryId
  }