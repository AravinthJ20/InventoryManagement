
const {connectDB}=require('./config/db')
const nodemailer = require('nodemailer');

// let businessView='UpdateVendor'

// let actionResponses=null;
// let payload={cancelcommends:"cancel remarks tester"}
async function getDataFromDB(payload,actionResponses,aggregation){
    try {
  

        let db=await connectDB("InventoryMangement");
  
  
      
  let req=null;
        // Replace placeholders in the aggregation pipeline
        const replacedAggregation = replacePlaceholders(aggregation,req);
  
        // Execute the aggregation pipeline
        const aggregationResult = await db.collection("Countries").aggregate(replacedAggregation).toArray();
  
        // Send the aggregation result as the response
        let response=JSON.stringify(aggregationResult)
        return response;
    } catch (error) {
        console.error('Error occurred:', error);
    }
}
function replacePlaceholders(params, req) {
    if (typeof params === 'object') {
      if (Array.isArray(params)) {
        return params.map(param => replacePlaceholders(param, req));
      } else {
        const newParams = {};
        for (const key in params) {
          if (params.hasOwnProperty(key)) {
            const value = params[key];
            newParams[key.replace('($)', '$')] = replacePlaceholders(value, req);
          }
        }
        return newParams;
      }
    } else if (typeof params === 'string') {
      // Replace ($) placeholders in strings
      let replacedString = params.replace(/\(\$\)/g, '$');
  
      // Replace {{body.path}} with corresponding req.body values
      replacedString = replacedString.replace(/{{body\.(.*?)}}/g, (_, key) => {
        const value = getNestedValue(req.body, key.trim());
        return value !== undefined ? value : `{{body.${key}}}`;
      });
      replacedString = replacedString.replace(/{{body\.(.*?)}}/g, (_, key) => {
        const value = getNestedValue(req.body, key.trim());
        return value !== undefined ? value : `{{body.${key}}}`;
      });
      // Replace {{params.path}} with corresponding req.params values
      replacedString = replacedString.replace(/{{payload\.(.*?)}}/g, (_, key) => {
        const value = getNestedValue(req.params, key.trim());
        return value !== undefined ? value : `{{payload.${key}}}`;
      });
  
      // Replace {{query.path}} with corresponding req.query values
      replacedString = replacedString.replace(/{{query\.(.*?)}}/g, (_, key) => {
        const value = getNestedValue(req.query, key.trim());
        return value !== undefined ? value : `{{query.${key}}}`;
      });
  
      // Replace {{headers.path}} with corresponding req.headers values
      replacedString = replacedString.replace(/{{headers\.(.*?)}}/g, (_, key) => {
        const value = getNestedValue(req.headers, key.trim().toLowerCase());
        return value !== undefined ? value : `{{headers.${key}}}`;
      });
  
      return replacedString;
    } else if (typeof params === 'function') {
      // Execute the function with the request as argument
      return params(req);
    } else {
      // If the params is not an object, array, string, or function, return it unchanged
      return params;
    }
  }

async function updateBusinessView(businessView,actionResponses,payload){
  try {

    let businessViewName = businessView; // Business view name
     payload = payload; // Assuming payload is sent in the request body

    // Retrieve the business view document from MongoDB
    let db=await connectDB("InventoryMangement");
    const businessViewDocument = await db.collection('Queries').findOne({ businessView: businessViewName });
    
    
    if (!businessViewDocument) {
      console.log(`Business view '${businessViewName}' not found.`);
      throw ('business view not found')
    }

    // Convert ($)set key to $set
    let setOperation = convertSetKey(businessViewDocument.set);
    setOperation = replacePlaceholders2(setOperation, payload);

    // Extract collection name
    const collectionName = businessViewDocument.collection;
    console.log(collectionName)
    const collection = db.collection(collectionName);

    // Match documents based on criteria
    const matchCriteria = replacePlaceholders2(businessViewDocument.match, payload);
    console.log(matchCriteria)
    const matchedDocuments = await collection.find({ Exportnumber: 'XYZ123' }).toArray();
    console.log(matchedDocuments)
    // Update matched documents
// Update matched documents with upsert option from the business view document
const filterOptions = businessViewDocument.filter || {};
const upsertOption = filterOptions.upsert || false; // Default to false if upsert option is not specified

let updateResult = await collection.updateMany(matchCriteria, setOperation, { upsert: upsertOption });  
    console.log(`Updated ${updateResult.modifiedCount} documents.`);
    console.log(`Inserted ${updateResult.upsertedCount} documents.`);


    // Redirect back to the homepage or any other page
    let updatedDocuments = await collection.find(matchCriteria).toArray();
    updatedDocuments=JSON.stringify(updatedDocuments)

    console.log("Updated Documents:", updatedDocuments);

    return updatedDocuments;
  } catch (error) {
    console.error('Error occurred:', error);
    return('Internal server error ')
  }

}


function convertSetKey(setOperation) {
    // Check if ($)set key exists in the setOperation object
    if ('($)set' in setOperation) {
        // Convert ($)set key to $set
        return { $set: setOperation['($)set'] };
    }
    return setOperation;
  }


  function replacePlaceholders2(params, payload) {
    if (typeof params === 'object' && params !== null) {
      if (Array.isArray(params)) {
        return params.map(param => replacePlaceholders2(param, payload));
      } else {
        const newParams = {};
        for (const key in params) {
          if (params.hasOwnProperty(key)) {
            const value = params[key];
  
            if (typeof value === 'string') {
              // ✅ Replace placeholders in strings
              newParams[key] = value.replace(/{{payload\.(.*?)}}/g, (_, key) => {
                return payload[key.trim()] !== undefined ? payload[key.trim()] : `{{payload.${key}}}`;
              });
            } else {
              // ✅ Recursive replacement for nested objects
              newParams[key] = replacePlaceholders2(value, payload);
            }
          }
        }
        return newParams;
      }
    }
    return params;
  }
  
  
  // Helper function to get nested values
  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }



  function mapFields(payload, action) {
    if (!action || action.actionType !== "mapFields") {
        throw new Error("Invalid action type. Expected 'mapFields'.");
    }

    const sourceSchema = payload; // Source schema is the payload
    const targetSchema = action.actionDetails.targetSchema;

    let mappedData = {};

    for (const [targetField, mappingDetails] of Object.entries(targetSchema)) {
        const { relatedField, relatedFieldType, type, params } = mappingDetails;

        // If it's a function, handle transformation
        if (relatedFieldType === "function") {
            if (typeof window !== "undefined" && typeof window[relatedField] === "function") {
                // Call function from global scope if available (browser)
                mappedData[targetField] = window[relatedField](sourceSchema, params);
            } else if (typeof global !== "undefined" && typeof global[relatedField] === "function") {
                // Call function from global scope if available (Node.js)
                mappedData[targetField] = global[relatedField](sourceSchema, params);
            } else {
                console.warn(`Function '${relatedField}' not found. Skipping field '${targetField}'.`);
            }
        } else {
            // Map simple field values
            mappedData[targetField] = sourceSchema[relatedField] || null;
        }
    }

    return mappedData;
}


// const payload = {
//     sapInvoiceNum: "INV-12345",
//     schReferenceNumber: "SCH-98765",
//     fiscalYear: "2024",
//     articleToBase64: function (source, params) {
//         // Example function to process attachments
//         return `Base64Encoded(${params[0].value})`;
//     }
// };

// const action = {
//     "id": 12,
//     "actionName": "attachement",
//     "actionType": "mapFields",
//     "actionDetails": {
//         "sourceSchema": "{{actionsResponse.getSapDocNumber[0]}}",
//         "targetSchema": {
//             "sapDocumentNumber": {
//                 "type": "string",
//                 "relatedField": "sapInvoiceNum"
//             },
//             "schDocumentNumber": {
//                 "type": "string",
//                 "relatedField": "schReferenceNumber"
//             },
//             "fiscalYear": {
//                 "type": "string",
//                 "relatedField": "fiscalYear"
//             },
//             "invoiceAttachments": {
//                 "type": "array",
//                 "relatedField": "articleToBase64",
//                 "relatedFieldType": "function",
//                 "params": [{ "key": "articleIdKey", "value": "invoice", "valueType": "sourceSchemaField" }]
//             },
//             "otherAttachments": {
//                 "type": "array",
//                 "relatedField": "articleToBase64",
//                 "relatedFieldType": "function",
//                 "params": [{ "key": "articleIdKey", "value": "others", "valueType": "sourceSchemaField" }]
//             }
//         }
//     }
// };
function getNestedValue2(obj, path) {
    return path.split('.').reduce((acc, part) => {
        if (!acc) return undefined;
        if (part.includes('[')) {
            // Handling array indexing, e.g., getSapDocNumber[0]
            const [key, index] = part.split(/\[|\]/).filter(Boolean);
            return acc[key] ? acc[key][Number(index)] : undefined;
        }
        return acc[part];
    }, obj);
}

function mapFields(payload, action, actionsResponse) {
    if (!action || action.actionType !== "mapFields") {
        throw new Error("Invalid action type. Expected 'mapFields'.");
    }

    // Extract the source schema path and resolve it from actionsResponse
    const sourceSchemaPath = action.actionDetails.sourceSchema.replace(/{{|}}/g, ''); // Remove {{ }}
    const sourceSchema = getNestedValue2(actionsResponse, sourceSchemaPath); 

    if (!sourceSchema) {
        console.error(`Source schema '${sourceSchemaPath}' not found in actionsResponse.`);
        return {};
    }

    const targetSchema = action.actionDetails.targetSchema;
    let mappedData = {};

    for (const [targetField, mappingDetails] of Object.entries(targetSchema)) {
        const { relatedField, relatedFieldType, type, params } = mappingDetails;

        if (relatedFieldType === "function") {
            if (typeof global !== "undefined" && typeof global[relatedField] === "function") {
                mappedData[targetField] = global[relatedField](sourceSchema, params);
            } else {
                console.warn(`Function '${relatedField}' not found. Skipping field '${targetField}'.`);
            }
        } else {
            mappedData[targetField] = getNestedValue2(sourceSchema, relatedField) || null;
        }
    }

    return mappedData;
}

// ActionsResponse (Separate from payload)
const actionsResponse = {
    getSapDocNumber: [
        {
            sapInvoiceNum: "INV-12345",
            schReferenceNumber: "SCH-98765",
            fiscalYear: "2024",
            articleToBase64: function (source, params) {
                return `Base64Encoded(${params[0].value})`;
            }
        }
    ]
};

// Payload (No need to merge actionsResponse)
const payload = { flag: true };

const action = {
    "id": 12,
    "actionName": "attachement",
    "actionType": "mapFields",
    "actionDetails": {
        "sourceSchema": "{{getSapDocNumber[0]}}", // Directly from actionsResponse
        "targetSchema": {
            "sapDocumentNumberTester": {
                "type": "string",
                "relatedField": "sapInvoiceNum"
            },
            "schDocumentNumber": {
                "type": "string",
                "relatedField": "schReferenceNumber"
            },
            "fiscalYear": {
                "type": "string",
                "relatedField": "fiscalYear"
            },
            "invoiceAttachments": {
                "type": "array",
                "relatedField": "articleToBase64",
                "relatedFieldType": "function",
                "params": [{ "key": "articleIdKey", "value": "invoice", "valueType": "sourceSchemaField" }]
            },
            "otherAttachments": {
                "type": "array",
                "relatedField": "articleToBase64",
                "relatedFieldType": "function",
                "params": [{ "key": "articleIdKey", "value": "others", "valueType": "sourceSchemaField" }]
            }
        }
    }
};

const result = mapFields(payload, action, actionsResponse);
console.log(result);

function nodeMailer (data) {
    console.log(data)
    const {recipientEmail, subject } = data;
 
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
            return 'Error sending email'
        } else {
            console.log('Email sent:', info.response);
            console.log('your otp is:',otp)
            return('Email sent successfully')

        }
    });
};

  module.exports=
  {getDataFromDB:getDataFromDB,
    updateBusinessView:updateBusinessView,
    nodeMailer:nodeMailer
  }
