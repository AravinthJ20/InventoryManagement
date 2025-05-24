require('dotenv').config()
const BASE_URL=process.env.BASE_URL
const PORT=process.env.PORT
const express=require('express')
const morgan=require('morgan');
const cors=require('cors')
const app=express()
const path=require('path')
const axios=require('axios')
const fs=require('fs')
const multer=require('multer')
const {ObjectId}=require('mongodb')
const session = require('express-session');
const exhbs=require('express-handlebars')
const {connectDB}=require('./config/db')
const api=require('./routes/api')
const {sendemail,verifyOTP}=require('./controllers/nodeMailer')
const bcrypter=require('./controllers/control.js')
const {executeActions}=require('./ActionsExecuter')
const adminAuth=require('./controllers/Auth')
const supplierRoutes=require('./routes/supplierRoutes')
const workflow=require('./routes/workflow')
const userRoutes=require('./routes/userRoutes')
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
// app.use(morgan('combined')) morgan log on hold
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 200 * 60 * 10000 }
  // cookie: { maxAge: 20 * 60 * 10000 } // 2 minutes cookie: { secure: false } // Set to true if using HTTPS
}));

// const corsOptions = {
//   origin: "http://localhost:300", // Allow only this origin
//   methods: 'POST', // Allow only GET and POST requests
//   allowedHeaders: 'Content-Type,Authorization', // Allow specific headers
// };
const allowedOrigins = ['http://localhost:3000', 'https://inventorymanagement-udi4.onrender.com'];

const corsOptions = {
  origin: (origin, callback) => {
      // Allow requests with no origin (e.g., same-origin requests, server-to-server requests)
      if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true); // Allow the request
      } else {
          callback(new Error('Not allowed by CORS')); // Block the request
      }
  },
  methods: 'GET', // Allow only GET requests
  allowedHeaders: 'Content-Type,Authorization', // Allow specific headers
};

app.use(cors(corsOptions));
app.engine('hbs',exhbs.engine({
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'Pages'), // Use path.join for cross-platform compatibility
  defaultLayout: false,

  partialsDir: path.join(__dirname, 'Pages/partials'), 
  defaultLayout:false,helpers: {
  ifCond: function (v1, operator, v2, options) {
      switch (operator) {
          case '===':
              return (v1 === v2) ? options.fn(this) : options.inverse(this);
          case '!==':
              return (v1 !== v2) ? options.fn(this) : options.inverse(this);
          case '<':
              return (v1 < v2) ? options.fn(this) : options.inverse(this);
          case '<=':
              return (v1 <= v2) ? options.fn(this) : options.inverse(this);
          case '>':
              return (v1 > v2) ? options.fn(this) : options.inverse(this);
          case '>=':
              return (v1 >= v2) ? options.fn(this) : options.inverse(this);
          default:
              return options.inverse(this);
      }
  },  gt: function (v1, v2) {
      return v1 > v2;
  },  increment: function(value) {
      return parseInt(value) + 1;
  },eq:function(a,b){
      return a === b;

  }
}
}))

app.set('view engine','hbs')
app.set('views','Pages')


app.use('/workflow-engine',workflow)
app.use('/userRoutes',userRoutes)
app.use(express.static(path.join(__dirname,'public')))

app.get('/admin/forgotPassword',(req,res)=>{
  res.sendFile(path.join(__dirname,'views','PasswordReset.html'))
})
.post('/admin/forgotPassword',sendemail)
app.post('/admin/verifyOTP',verifyOTP)
app.get('/index',(req,res)=>{
  res.render('HomePage')
})
app.get('/inbox',(req,res)=>{
  res.render('inbox')
})
app.post('/admin/setPassword',async (req,res)=>{

  let client=await connectDB("InventoryMangement");
  const collection=client.collection('Users')

    const newPassword=await bcrypter.securePassword(req.body.newToken)
    console.log('new pass',newPassword)
    const updatePassword=await collection.updateOne({email:req.body.email},{$set:{password:newPassword}})
    console.log('reset maik',req.body,req.body.email,updatePassword)
    res.send('data updated')
})

app.post('/api/sendEmail2',api.sendemail3)
app.get('/workflowlog',(req,res)=>{
  // res.sendFile(path.join(__dirname,'views','workflowlog.html'))
  res.render('workflowlog')
})
app.get('/',async (req,res)=>{

    // res.sendFile(path.join(__dirname,'views','Home.html'))
    res.render('Home')
})
app.get('/views/:viewname',adminAuth.isLogged,supplierRoutes.supplierRoutes2)
app.get('/pages/:viewname',adminAuth.isLogged,supplierRoutes.supplierRoutes)

app.get('/popups/:pop', (req, res) => {
  console.log(req.params)
  let popupupName=req.params.pop
  res.sendFile(path.join(__dirname, 'views', popupupName))
});


app.post('/PostData',async (req,res)=>{

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
   
})
app.get("/adminLogin",adminAuth.islogout,adminAuth.login)
app.get("/logout",adminAuth.logout)

app.post("/adminLoginTest",adminAuth.loginVerify)
app.post('/adminLogin',adminAuth.adminLogin)
app.get('/getProductDetails',async(req,res)=>{
  let db=await connectDB("InventoryMangement");
  let collection=db.collection('Suppliers')
  let vendorId=req.query.mediID
  const data = await collection.aggregate([
    { $match: { vendorId:vendorId }  }, // Filter for documents where vendorId exists
    
    { $project: { _id: 0} },               // Sort by extracted numeric part
                             
  ]).toArray();
  console.log('Data fetched');

  // Send JSON response
  res.json({
      data
    
  });

})
app.get('/fetchPageData2', async (req, res) => {
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
});
app.post('/fetchPageData', async (req, res) => {

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


  
});

app.post('/loadFilter', async (req, res) => {
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
});

async function insertData(data,collectionName){
    let db=await connectDB("InventoryMangement");
    let collection=db.collection(collectionName)
    let primaryName="vendorId"
    let  primaryPrefix="VEND"
    let primary=await generatePrimaryId(primaryName,primaryPrefix)
    data[primaryName]=primary
    console.log('primary...',data[primaryName])
    let insertResult=await collection.insertOne(data)
    return primary;

}
async function generatePrimaryId(primaryName, primaryPrefix) {
  try {
      let db=await connectDB("InventoryManagement");
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
// function replacePlaceholders(params, req) {
//   console.log("user",req.headers.userid)

//   if (typeof params === 'object') {
//       if (Array.isArray(params)) {
//           return params.map(param => replacePlaceholders(param, req));
//       } else {
//           const newParams = {};
//           for (const key in params) {
//               if (params.hasOwnProperty(key)) {
//                   const value = params[key];
//                   newParams[key.replace('($)', '$')] = replacePlaceholders(value, req);
//               }
//           }
//           return newParams;
//       }
//   } else if (typeof params === 'string') {
//       // Replace ($) placeholders in strings
//       return params.replace(/\(\$\)/g, '$');
//   } else if (typeof params === 'function') {
//       // Execute the function with the request as argument
//       return params(req);
//   } else {
//       // If the params is not an object, array, string, or function, return it unchanged
//       return params;
//   }
// }
// Define a route to handle form submission and call the aggregation business view



// function replacePlaceholders(params, req) {
//   console.log("user", req.headers.userid);

//   if (typeof params === 'object') {
//     if (Array.isArray(params)) {
//       return params.map(param => replacePlaceholders(param, req));
//     } else {
//       const newParams = {};
//       for (const key in params) {
//         if (params.hasOwnProperty(key)) {
//           const value = params[key];
//           newParams[key.replace('($)', '$')] = replacePlaceholders(value, req);
//         }
//       }
//       return newParams;
//     }
//   } else if (typeof params === 'string') {
//     // Replace ($) placeholders in strings
//     let replacedString = params.replace(/\(\$\)/g, '$');

//     // Replace {{placeholder}} with corresponding req.body values
//     replacedString = replacedString.replace(/{{(.*?)}}/g, (_, key) => {
//       const trimmedKey = key.trim();
//       return req.body[trimmedKey] !== undefined ? req.body[trimmedKey] : `{{${trimmedKey}}}`;
//     });

//     return replacedString;
//   } else if (typeof params === 'function') {
//     // Execute the function with the request as argument
//     return params(req);
//   } else {
//     // If the params is not an object, array, string, or function, return it unchanged
//     return params;
//   }
// }

const _ = require('lodash');
const { deepStrictEqual } = require('assert')
function convertDollarOperators(data) {
  if (Array.isArray(data)) {
    return data.map(item => convertDollarOperators(item));
  } else if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const key in data) {
      console.log(`Processing key: ${key}`); // Debug log
      // Convert keys like ($)match to $match
      const newKey = key.startsWith('($)') ? `$${key.slice(3)}` : key;
      console.log(`Converted key: ${newKey}`); // Debug log
      result[newKey] = convertDollarOperators(data[key]);
    }
    return result;
  }
  return data;
}
// function replacePlaceholders(data, req) {
//   if (Array.isArray(data)) {
//     return data.map(item => replacePlaceholders(item, req));
//   } else if (typeof data === 'object' && data !== null) {
//     const result = {};
//     for (const key in data) {
//       result[key] = replacePlaceholders(data[key], req);
//     }
//     return result;
//   } else if (typeof data === 'string' && data.startsWith('{{') && data.endsWith('}}')) {
//     // Extract the path from the placeholder (e.g., "componentSetting.rowfilter", "body.status", "query.someQueryParam", "headers.user")
//     const path = data.slice(2, -2).trim();
//     // Use optional chaining and provide a default value if the path is undefined
//   try {
//       // Use eval to dynamically access the value from the request object
//       const value = eval(`req?.${path}`);
//       return value !== undefined ? value : null; // Return null if the path is undefined
//     } catch (error) {
//       // If eval fails (e.g., invalid path), return null
//       return null;
//     }  }
//   return data;
// }

// API endpoint to execute dynamic aggregation


function replacePlaceholders(data, req) {
  if (Array.isArray(data)) {
    return data.map(item => replacePlaceholders(item, req));
  } else if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const key in data) {
      result[key] = replacePlaceholders(data[key], req);
    }
    return result;
  } else if (typeof data === 'string' && data.startsWith('{{') && data.endsWith('}}')) {
    // Extract the content inside the placeholder (e.g., "toInt componentSetting.invoiceAmt")
    const content = data.slice(2, -2).trim();

    // Check if the content contains a transformation function
    const transformationMatch = content.match(/^(toInt|toString|toFloat|toBoolean)\s+(.+)$/);
    if (transformationMatch) {
      const [_, transformation, path] = transformationMatch;
      try {
        // Extract the value from the request object
        const value = eval(`req?.${path}`);
        if (value === undefined || value === null) return null;

        // Apply the transformation
        switch (transformation) {
          case 'toInt':
            return parseInt(value, 10);
          case 'toString':
            return String(value);
          case 'toFloat':
            return parseFloat(value);
          case 'toBoolean':
            return Boolean(value);
          default:
            return value; // No transformation applied
        }
      } catch (error) {
        // If eval fails (e.g., invalid path), return null
        return null;
      }
    } else {
      // No transformation, treat as a regular placeholder
      try {
        const value = eval(`req?.${content}`);
        return value !== undefined ? value : null;
      } catch (error) {
        return null;
      }
    }
  }
  return data;
}
app.post('/callAggregationBusinessView', async (req, res) => {
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
      headers: req.headers // Pass headers
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
});






app.post('/callBusinessView', async (req, res) => {
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
});

app.post('/executeRules',async(req,res)=>{
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
})
app.get('/log/:productId',async(req,res)=>{
 
  let db=await connectDB("InventoryMangement");

  const productId=req.params.productId;

  try{
const data=await db.collection('workitems').find({ productId:productId }).toArray()
console.log(data,'work flow log is ')
const workflowId=data[0].workflowId
let pendingUser=await db.collection('workitems').findOne({ productId:productId,status:"pending"})
let workitem=await db.collection('workitems').findOne({ productId:productId,status:"pending"})

console.log('user',pendingUser)
if(pendingUser){
  pendingUser=pendingUser.approver
}
else{
  pendingUser=null
}
app.get('/upload-popup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload-popup.html'));
});
console.log('role is '+req.session.role)
const role=req.session.role


res.json({log:data,productId:productId,workflowId:workflowId,pendingUser:pendingUser,role:role,  decisions: workitem?.Decisions || []
});

  //  res.render('workflowlog',{log:data,productId:productId,workflowId:workflowId,pendingUser:pendingUser,role:role});
}
catch(err){
  console.log(err)
  res.json("Unable to Fetch Details",err)

}
// res.json({log:data,productId:productId,workflowId:workflowId,pendingUser:pendingUser,role:role})
})

function convertSetKey(setOperation) {
  // Check if ($)set key exists in the setOperation object
  if ('($)set' in setOperation) {
      // Convert ($)set key to $set
      return { $set: setOperation['($)set'] };
  }
  return setOperation;
}
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      // cb(null, 'uploads/');
      cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/uploadAttachments', upload.array('attachments'), async (req, res) => {
  const { articleId } = req.body;

  try {
    // Connect to the database
    const db = await connectDB('InventoryMangement');
    const attachmentsCollection = db.collection('attachments');

    // Process the uploaded files
    const files = req.files.map((file) => ({
      originalName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      fileSize: file.size,
      fileType: file.mimetype,
    }));

    let result;

    if (articleId) {
      // If articleId is provided, check if it exists in the attachments collection
      const existingDocument = await attachmentsCollection.findOne({ articleId: ObjectId(articleId) });

      if (existingDocument) {
        // If the articleId exists, update the existing document with new attachments
        result = await attachmentsCollection.updateOne(
          { articleId: ObjectId(articleId) },
          { $push: { attachments: { $each: files } } }
        );

        return res.status(200).json({
          success: true,
          articleId,
          files: [...existingDocument.attachments, ...files],
        });
      } else {
        // If articleId does not exist, create a new document with the new attachments
        const newArticle = {
          articleId: ObjectId(articleId),
          attachments: files,
        };

        result = await attachmentsCollection.insertOne(newArticle);
        return res.status(200).json({
          success: true,
          articleId: result.insertedId,
          files: newArticle.attachments,
        });
      }
    } else {
      // If no articleId is provided, create a new document with the files
      const newArticle = {
        articleId: new ObjectId(),
        attachments: files,
      };

      result = await attachmentsCollection.insertOne(newArticle);
      return res.status(200).json({
        success: true,
        articleId: result.insertedId,
        files: newArticle.attachments,
      });
    }
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
// Fetch attachments route

app.get('/getAttachments', async (req, res) => {
  const { articleId } = req.query;
console.log(articleId,'a')
  try {
    // Connect to the database
    const db = await connectDB('InventoryMangement');
    const attachmentsCollection = db.collection('attachments');

    // Ensure the articleId is properly converted to an ObjectId
    const articleIdObj = new ObjectId(articleId);

    // Find the document with the provided articleId
    const existingDocument = await attachmentsCollection.findOne({ _id: articleIdObj });
    console.log(existingDocument,'exis')

    if (!existingDocument) {
      return res.status(404).json({ error: 'Article not found or no attachments available' });
    }

    // Return the attachments if found
    return res.status(200).json({
      success: true,
      articleId,
      attachments: existingDocument.attachments,
    });
  } catch (err) {
    console.error('Error fetching attachments:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/permission',async (req, res, next) => {
    const userRole = req.headers.role; // This would typically come from user session
    let client=await connectDB("InventoryMangement");

console.log('permission api',userRole)
  
        const permissions = await client.collection('Permissions').findOne({ role: userRole });
        console.log('permissions',permissions)
       if(permissions!=null){
        try{
        const settings = await client.collection('Settings').find().toArray();
        console.log('Settings:', JSON.stringify(settings, null, 2));
console.log('role',req.headers.role)
        // Build dynamic menu and submenu
        let dynamicMenus = [];
        if(permissions!=null){
        permissions.Menus.forEach(menu => {
          const mainMenuSetting = settings.find(setting => 
            setting.MainMenu.some(m => m.Menu === menu)
        );
        
        let menuIcon = '#';
        if (mainMenuSetting) {
            const matchedMainMenu = mainMenuSetting.MainMenu.find(m => m.Menu === menu);
            if (matchedMainMenu) {
                menuIcon = matchedMainMenu.icon;
            }
        }
        let menuItem = { 
          name: menu, 
          url: '#', 
          icon: menuIcon, // Add the main menu icon here
          subMenus: [] 
      };

            // Find matching submenus and their routes
            permissions.SubMenus.forEach(subMenu => {
                if (subMenu.startsWith(menu)) {
                    const subMenuName = subMenu.split('.')[1];

                    // const routeObj = settings.find(r => r.Menu === subMenu);
                    // const routeUrl = routeObj ? routeObj.url : '#';
                    const routeObj = settings.find(setting => 
                        setting.Routes.some(route => route.Menu === subMenu)
                    );
            
                    // Log routeObj to see what was found
                    console.log(`Route Object for ${subMenu}:`, routeObj);
            
                    // Check if routeObj is found and get the route URL
                    let routeUrl = '#'; // Default to '#' if not found
                    let icon = '#';
                    if (routeObj) {
                        const matchedRoute = routeObj.Routes.find(route => route.Menu === subMenu);
                        if (matchedRoute) {
                            routeUrl = matchedRoute.url; // Get the URL if matched
                            icon=matchedRoute.icon
                        }}
console.log(routeObj,routeUrl)
                    menuItem.subMenus.push({ name: subMenuName, url: routeUrl,icon:icon });
                }
            });

            dynamicMenus.push(menuItem);
        });

        // Attach to the response object to use in Handlebars
        res.locals.dynamicMenus = dynamicMenus;
        res.json({menus:dynamicMenus})}else{
            res.json([])
        }
        // res.render('permissionchecker');
      } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching menus');
    }
      }
      else{
        res.json([])
      }
    
})

app.listen(PORT,()=>console.log(`app listening at http://localhost:${PORT}`))

app.post('/random',async (req, res) => {
  let db=await connectDB("InventoryMangement");
  let collection=db.collection('Suppliers')
  const bulkOps = [];

for (let i = 1; i <= 40; i++) {
  const id = `VEND${i.toString().padStart(2, '0')}`;
  const numberValue = i * 10; // Just an example: number increases per vendor
  const dateValue = new Date(2025, 0, i); // Jan 1st to Jan 40th (some will overflow to Feb)

  bulkOps.push({
    updateOne: {
      filter: { vendorId: id },
      update: {
        $set: {
          sequence: numberValue,
          createdOn: dateValue
        }
      }
    }
  });
}

collection.bulkWrite(bulkOps);


})