
const jwt=require('jsonwebtoken')
const BASE_URL=process.env.BASE_URL

const dotenv=require('dotenv')
const dbo=require('../../config/db.js')
const {connectDB}=require('../../config/db.js')

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

function convertSetKey(setOperation) {
  // Check if ($)set key exists in the setOperation object
  if ('($)set' in setOperation) {
      // Convert ($)set key to $set
      return { $set: setOperation['($)set'] };
  }
  return setOperation;
}

module.exports={
    insertData,
    generatePrimaryId,
    replacePlaceholders,
    convertDollarOperators,
    convertSetKey
}