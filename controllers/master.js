const jwt=require('jsonwebtoken')
const BASE_URL=process.env.BASE_URL

const dotenv=require('dotenv')
const dbo=require('../config/db.js')
const primary=require('./keyGenerator.js')
const bcrypter=require('./control.js')
const {connectDB}=require('../config/db')

const{   insertData,
    generatePrimaryId,
    replacePlaceholders,
    convertDollarOperators,
    convertSetKey}=require('../services/Supplier/supplierService.js')

    const path=require('path')
const axios=require('axios')
require('dotenv').config()


const setPassword=async (req,res)=>{

  let client=await connectDB("InventoryMangement");
  const collection=client.collection('Users')

    const newPassword=await bcrypter.securePassword(req.body.newToken)
    console.log('new pass',newPassword)
    const updatePassword=await collection.updateOne({email:req.body.email},{$set:{password:newPassword}})
    console.log('reset maik',req.body,req.body.email,updatePassword)
    res.send('data updated')
}
const PostData=async (req,res)=>{

    try{
      let db=await connectDB("InventoryMangement");
      let collection=db.collection('user')
      console.log('req',req.body)
      let data=req.body;
      data={

  supplierName:data.form_1.firsName,
 regDate:Date.now(),
firstName: data.form_1.firsName,
  lastName: data.form_1.lastName,
  name: data.form_1.name,
  annualTurnover:data.form_1.annualTurnover,
  phone: data.form_1.phone,
  age:data.form_1.age,
  email: data.form_1.email,
supportDocs: data.form_1.supportDocs,
  otherDocs:data.form_1.otherDocs,
  country: data.form_1.country,
  website: data.form_1.website,
  dateOfEstablishment: data.form_1.dateOfEstablishment,
  companyLogo: data.form_1.companyLogo,
  logBg: data.form_1.logBg,


 address: data.form_2.address,
  vendorType:data.form_2.vendorType,
  eventTime: data.form_2.eventTime,
  contractAgreement: data.form_2.contractAgreement,
addressDetails:data.table_1,
categories:data.table_2




      }
      let insertResult=await insertData(data,'Suppliers')
      console.log('i',insertResult)
    await axios.post(`${BASE_URL}/workflow-engine/workflowTrigger`,{primaryKey:insertResult})
    console.log('insertResult',insertResult)
    res.status(200).send({primaryKey:insertResult}) 
  }
    catch(err)
    {
      console.log(err)
    }
   
}

const fetchPageData=async (req, res) => {

  let result = [];
//   let data ={
//     "businessViews": [
//         "getSample",
//         "getMaterials"
//     ],
//     "params": {
//         "pagination": {
//             "getMaterials": {
//                 "skip": 0,
//                 "limit": 5
//             }
//         }
//     }
// }

let data=req.body
console.log('fetch page data',data.params.pagination)
  for (const businessView of data.businessViews) {

    const page = parseInt(req.params.pagination) || 1; // Default to page 1
  const limit =data.params.pagination[businessView]?.limit || 10;
  const skip = (page - 1) * limit;
  
  data.params.skip=skip;
  data.params.limit=limit;
 let componentSetting=req?.body?.params?.pagination[businessView] ||{}
 componentSetting.rowfilter=req?.body?.params?.pagination[businessView]?.rowfilter || {}
 //new
 componentSetting.searchInput=req?.body?.params?.pagination[businessView]?.searchInput || {}
 console.log('componentSetting',componentSetting,req.body.params.pagination.getMaterials)
  try {

      const response = await axios.post(`${BASE_URL}/callAggregationBusinessView`, { businessView:businessView,params:data.params,componentSetting:componentSetting });
      // let count=Number( response.data[0].count[0].count) 
      let count = Number(response?.data?.[0]?.count?.[0]?.count || 0);

      let lim=Number(data.params.pagination[businessView]?.limit) || 0
      let totalpage=Math.ceil(count/lim) || 0
      result.push({ datasource: businessView, data: response.data[0].results,count:count ,  totalPages: totalpage });
      
  } catch (error) {
      console.error(`Error fetching data for ${businessView}:`, error.message);
      result.push({ datasource: businessView, data: null }); // Handle errors gracefully
  }
  }

  data=result
  res.send(data)


  
}

const fetchPageData2=async (req, res) => {
  let db=await connectDB("InventoryMangement");
  let collection=db.collection('Suppliers')

  // Get the page and limit from the query params
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
  
  const sortOrder = parseInt(req.query.sortOrder); // Default to page 1
  const sortfield =req.query.sortfield; // Default to 10 items per page
console.log(`page${page} limit${limit} sort${sortfield} order${sortOrder}`)
  try {
      // Count the total number of documents
      const totalCount = await collection.countDocuments({vendorId:{$exists:true}});
      
      // Calculate how many documents to skip based on the current page
      const skip = (page - 1) * limit;

      // Fetch the paginated data
      // const findQuery = collection.find({vendorId:{$exists:true},{$sort:{}}})
      //     .sort({vendorId: -1 })
      //     .skip(skip)
      //     .limit(limit)
    
      //  const data = await findQuery.toArray();

      // const data = await collection.aggregate([
      //   { $match: { vendorId: { $exists: true } } }, // Filter for documents where vendorId exists
      //   { $sort: { vendorId: 1 } },                 // Sort documents by vendorId in descending order
      //   { $skip: skip },                             // Skip the specified number of documents
      //   { $limit: limit }                            // Limit the result set
      // ]).toArray();
      const data = await collection.aggregate([
        { $match: { vendorId: { $exists: true } } }, // Filter for documents where vendorId exists
        {
          $addFields: {
            numericPart: { $toInt: { $arrayElemAt: [ { $split: ["$vendorId", "VEND"] }, 1 ] } }
          }
        },
        { $sort: { numericPart: -1 } },               // Sort by extracted numeric part
                             // Limit the result set
        
         { $facet: {


          paginatedResults: [
                   { $skip: skip },                             // Skip the specified number of documents
        { $limit: limit }, 
          {
              $project: {_id:0}
          }
      ],
              totalCount: [
                  {
                      $count: "count"
                  }
              ],
              chartData: [
              
                  {
                      $group: {
                          _id:"$status",
                          count: {
                              $sum:1
                          }
                      }
                  },
                  {
                      $match: {
                          _id: {
                              $ne: null
                          }
                      }
                  },
                  {
                      $project: {
                          _id: 0,
                          x: "$_id",
                          y: "$count"
                      }
                  }
              ]
            }}
      
      ]).toArray();
      console.log('Data fetched');

      // Send JSON response
      res.json({
          items: data,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
      });

  //         // Get the page and limit from the query params
  // const page = parseInt(req.query.page) || 1; // Default to page 1
  // const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

  // try {
  //     // Count the total number of documents
  //     const totalCount = await collection.countDocuments();
      
  //     // Calculate how many documents to skip based on the current page
  //     const skip = (page - 1) * limit;

  //     // Fetch the paginated data
  //     const findQuery = collection.find({})
  //         .sort({ "userid": -1 })
  //         .skip(skip)
  //         .limit(limit);

  //     data = await findQuery.toArray();
  //     console.log('Data fetched');

  //     // Pass totalCount, page, and limit to the front end for pagination
  //     res.render('userListbkp', {
  //         data,
  //         totalPages: Math.ceil(totalCount / limit),
  //         currentPage: page,
  //         rowsPerPage: limit,
  //     });
  // }
  } catch (error) {
      console.log('Data not fetched:', error);
      res.status(500).json({ error: 'Error fetching data' });
  }
}
const loadFilter= async (req, res) => {
  let data = req.body[1].table;

  for (const businessView of data) {
    let queryID = businessView.filterDatasource;
    console.log('Query ID:', queryID);

    try {
      // Make the API call with the query ID
      const response = await axios.post(`${BASE_URL}/callAggregationBusinessView`, { businessView: queryID });
      console.log('Response:', response.data);

      // Assuming the response data is an array of objects with field names
      const queryOutput = response.data[0].results; // e.g., [{ materialId: "value1" }, { materialId: "value2" }]

      // Extract unique field names from the query output
      const fieldNames = Object.keys(queryOutput[0] || {}); // Get field names from the first object

      // Update the filterColumns data for matching techname
      businessView.filterColumns.forEach(column => {
        if (fieldNames.includes(column.techname)) {
          // Extract data for the matching techname from the query output
          column.data = queryOutput.map(item => item[column.techname]); // Set the data field
        }
      });

    } catch (e) {
      console.log('Error:', e);
    }
  }

  console.log('Updated Table Data:', data);
  res.status(200).json({ table: data }); // Send the updated table data back in the response
}

const callAggregationBusinessView=async (req, res) => {
  try {
    console.log('Request Body:', req.body);

    const { businessView } = req.body; // Aggregation business view name
    const db = await connectDB('InventoryMangement');

    // Retrieve the aggregation business view document from MongoDB
    const businessViewDocument = await db.collection('Queries').findOne({ businessView });

    if (!businessViewDocument) {
      console.log(`Aggregation business view '${businessView}' not found.`);
      return res.status(404).send('Business view not found');
    }
    const convertedAggregation = convertDollarOperators(businessViewDocument.aggregation);

let searchtermfields=businessViewDocument.searchTermFields
let searchInput=req?.body?.componentSetting?.searchInput


if (!req.body.componentSetting) {
  req.body.componentSetting = {}; // Initialize componentSetting if undefined
}

if (searchInput && Object.keys(searchInput).length > 0) {
  req.body.componentSetting.searchInput = {
    "$or": searchtermfields.map(field => ({
      [field]: { "$regex": searchInput, "$options": "i" } // Case-insensitive search
    }))
  };
} else {
  req.body.componentSetting.searchInput = {};
}
    console.log('converted Aggregation:',searchInput, JSON.stringify(convertedAggregation, null, 2));

    // Replace placeholders in the aggregation pipeline
    
    const replacedAggregation = replacePlaceholders(convertedAggregation, {
      componentSetting: req.body.componentSetting,
params:req.body.params,
      headers: req.headers ,// Pass headers,/
      body: req.body // Pass the request
    });

    // Log the replaced aggregation for debugging
    console.log('Replaced Aggregation:', JSON.stringify(replacedAggregation, null, 2));

    // Execute the aggregation pipeline
    const aggregationResult = await db
      .collection(businessViewDocument.collection)
      .aggregate(replacedAggregation)
      .toArray();

    // Send the aggregation result as the response
    res.json(aggregationResult);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Internal Server Error');
  }
}

const callBusinessView=async (req, res) => {
  try {
    console.log('bv name',req.body.businessView)

    const businessViewName = req.body.businessView; // Business view name
    const payload = req.body; // Assuming payload is sent in the request body

    // Retrieve the business view document from MongoDB
    let db=await connectDB("InventoryMangement");
    const businessViewDocument = await db.collection('Queries').findOne({ businessView: businessViewName });
    
    
    if (!businessViewDocument) {
      console.log(`Business view '${businessViewName}' not found.`);
      return res.redirect('/');
    }

    // Convert ($)set key to $set
    const setOperation = convertSetKey(businessViewDocument.set);

    // Extract collection name
    const collectionName = businessViewDocument.collection;
    console.log(collectionName)
    const collection = db.collection(collectionName);

    // Match documents based on criteria
    const matchCriteria = businessViewDocument.match;
    console.log(matchCriteria)
    const matchedDocuments = await collection.find({ Exportnumber: 'XYZ123' }).toArray();
    console.log(matchedDocuments)
    // Update matched documents
// Update matched documents with upsert option from the business view document
const filterOptions = businessViewDocument.filter || {};
const upsertOption = filterOptions.upsert || false; // Default to false if upsert option is not specified

const updateResult = await collection.updateMany(matchCriteria, setOperation, { upsert: upsertOption });  
    console.log(`Updated ${updateResult.modifiedCount} documents.`);
    console.log(`Inserted ${updateResult.upsertedCount} documents.`);

    // Redirect back to the homepage or any other page
    res.json(updateResult);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Internal Server Error');
  }
}

const executeRules=async(req,res)=>{
  let db=await connectDB("InventoryMangement");

  const collection = db.collection('pageActions');
    let payload=req.body
  // Await the result of findOne()
  let actionsDocument = await collection.findOne({ actionName: req.body.actionName });

  if (!actionsDocument) {
    console.error("No actions found for 'FirstActions'");
    return;
  }

  console.log('actions', actionsDocument);

  // Extract actions array
  let actions = actionsDocument.actions;
  let output = actionsDocument.output;
  // Execute actions
 

let result =await executeActions(actions,payload,req.body.actionName,output)
console.log(result)
res.send({"resulset":"24","result1":result})
}

module.exports={
setPassword,
PostData,
fetchPageData,
fetchPageData2,
loadFilter,
callBusinessView,
executeRules,
callAggregationBusinessView

}