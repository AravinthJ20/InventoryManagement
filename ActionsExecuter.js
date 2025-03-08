const express = require('express');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT;
const path = require('path');
const axios = require('axios');
const{getDataFromDB,updateBusinessView,nodeMailer}=require('./ActionRules')
const{generatePrimaryId}=require('./controllers/utils')
const { connectDB } = require('./config/db');
app.use(express.json());
let aggregation=[
  {
    "($)match": {
    
    }
  },
  {
    "($)unwind": "($)states"
  },
  {
    "($)facet": {
      "results": [
        {
          "($)project": {
            "_id": "($)states.state_code",
            "test": "($)states.name"
          }
        }
      ],
      "count": [
        {
          "($)count": "count"
        }
      ]
    }
  }
]
async function handleConditional(action, payload, actionResponses) {
  let conditionExpression = action.actionDetails.WHEN.replace(/{{payload\.(\w+)}}/g, (match, key) => {
      return JSON.stringify(payload[key]); 
  });

  console.log("Evaluating condition:", conditionExpression);

  const conditionFunction = new Function(`return ${conditionExpression};`);
  const condition = conditionFunction();

  const selectedBlock = condition ? action.actionDetails.THEN : action.actionDetails.ELSE;
  const response = {};
  let nextActionId = null;

  selectedBlock.forEach((entry) => {
      let [key, value] = entry.split('=');
      key = key.trim();
      value = value.trim();

      // Handle nested placeholders for actionResponses
      value = value.replace(/{{actionResponses\.(\w+)(?:\.(\w+))?}}/g, (match, actionName, field) => {
          if (field) {
              return JSON.stringify(actionResponses[actionName]?.[field] || '');
          }
          return JSON.stringify(actionResponses[actionName] || '');
      });

      if (key === "nextAction") {
          nextActionId = parseInt(value);
      } else {
          response[key] = value;
      }
  });

  console.log("Conditional evaluated to:", condition);
  console.log("Generated Action Response:", response);
  console.log("Moving to next action ID:", nextActionId);

  return { nextActionId, response };
}




async function handleGetDataFromDB(action, payload, actionResponses) {
    console.log('Fetching data from DB for...',action.actionDetails.database_details);
    const data = { exampleData: `Sample data from database - ${action.actionName}` };
    console.log('Previous action responses:', actionResponses);
    console.log('Current action result:', data);


    // retunr output not work..........

    // getDataFromDB(null, null, aggregation)
    // .then(output => {
    //   console.log("Fetched Data:", output);
    // return output;

    // })
    // .catch(error => console.error("Error fetching data:", error));
    
    // solution 1............
//     try {
//         let output = await getDataFromDB(null, null, aggregation); // Await the DB response
//         console.log("Fetched Data:", output);
// output=JSON.stringify(output)
//         return output; // Ensure the function returns the resolved value
//     } catch (error) {
//         console.error("Error fetching data:", error);
//         return null; // Handle errors gracefully
//     }

   //solution2................
   return getDataFromDB(null, null, aggregation)
   .then(output => {
       console.log("Fetched Data:", output);
       return output;  // Ensures function returns data to caller
   })
   .catch(error => {
       console.error("Error fetching data:", error);
       return null;  // Return null on error so execution doesn't break
   });

}

async function handleMapFields(action, payload, actionResponses) {
    console.log('Mapping fields...');
    const mappedData = { mappedField: 'Mapped data' };
    return mappedData;
}

function handleCompleted(action, payload, actionResponses){
return 'end'
}
async function handleUpdateBusinessView(action, payload, actionResponses) {
    console.log('Updating business view...',payload.supplierId);
    let businessView=action.actionDetails.businessView

    
    let test={cancelcommends:"cancel remarks tester2"}

    return updateBusinessView(businessView, null, payload)
    .then(output => {
      console.log("Fetched Data:", output);
      
    return output;
    })
    .catch(error => console.error("Error fetching data:", error));
    

}

async function handleWebhook(action, payload, actionResponses) {
    console.log('handleWebhook completed!');
    let  baseurl="https://webhook.site/"
    let absoluteUrl="6b36a9c3-9019-4a7a-b4a7-78ea59eea803"
let url=baseurl.concat(absoluteUrl)
console.log('webhook',url)
let data={
    'test':'test'
}
    let output=await axios.post(url,data)
    return output;
}
async function executeApi(action, payload, actionResponses) {
    let data={
        subject:"Subject Tester",
        recipientEmail:"aravinth2000jjj@gmail.com"
    }
    let output=nodeMailer(data)
    console.log('executeApi completed!');
    return output;
}
async function executeApi(action, payload, actionResponses) {
    let data={
        subject:"Subject Tester",
        recipientEmail:"aravinth2000jjj@gmail.com"
    }
    let output=nodeMailer(data)
    console.log('executeApi completed!');
    return output;
}
async function handleInsertISData(action, payload, actionResponses) {
    console.log('Insert Data!', action.actionDetails.payload);
console.log('payload',payload)
    // Replace placeholders with actual values
   
    let data = JSON.parse(
        JSON.stringify(action.actionDetails.payload).replace(/{{payload\.(.*?)}}/g, (match, path) => {
            return path.split('.').reduce((obj, key) => obj?.[key] ?? match, payload);
        })

      
    );

    let primaryName=action.actionDetails.primaryKey.fieldName
    let  primaryPrefix=action.actionDetails.primaryKey.prefix
    let collectionName=action.actionDetails.database_details.collection
    let primary=await generatePrimaryId(primaryName,primaryPrefix)

    data[primaryName]=primary

    console.log("Processed Insert Payload:", data,data[primaryName],primary);

    const db = await dbClient.connectDB("InventoryMangement");
        const collection = db.collection(collectionName);
    let result=await collection.insertOne(data)

    return data;
}

// Find index by action ID
function findIndexById(actions, id) {
    return actions.findIndex(act => act.id === parseInt(id));
}

// Dispatcher Function
// async function executeActions(actions, payload) {
//     const actionResponses = {};
//     let currentIndex = 0;

//     async function executeNextAction() {
//         if (currentIndex >= actions.length) {
//             console.log('All actions completed.');
//             console.log('Final Action Responses:', actionResponses);
//             return;
//         }

//         const action = actions[currentIndex];
//         console.log(`Executing action: ${action.actionName} (ID: ${action.id})`);

//         let response;
//         let nextActionId = null;

//         switch (action.actionType) {
//             case 'conditional':
//                 response = await handleConditional(action, payload, actionResponses);
//                 nextActionId = response.nextActionId;
//                 actionResponses[action.actionName] = response.response;

//                 break;
//             case 'getDataFromDB':
//                 response = await handleGetDataFromDB(action, payload, actionResponses);
//                 actionResponses[action.actionName] = response;
//                 nextActionId = action.actionDetails?.nextAction;
//                 break;
//             case 'mapFields':
//                 response = await handleMapFields(action, payload, actionResponses);
//                 actionResponses[action.actionName] = response;
//                 nextActionId = action.actionDetails?.nextAction;
//                 break;
//             case 'updateBusinessView':
//                 response = await handleUpdateBusinessView(action, payload, actionResponses);
//                 actionResponses[action.actionName] = response;
//                 nextActionId = action.actionDetails?.nextAction;
//                 break;
//             case 'completed':
//                 response = await handleCompleted(action, payload, actionResponses);
//                 actionResponses[action.actionName] = response;
//                 currentIndex = actions.length; // Stop execution
//                 return;
//             default:
//                 console.error(`Unknown action type: ${action.actionType}`);
//                 return;
//         }
//         const endTime = new Date(); // Track execution end time

//         // Log the action execution details
//         await logAction(action, payload, response, true, startTime, endTime);


//         // Determine the next index to execute
//         if (nextActionId) {
//             currentIndex = findIndexById(actions, nextActionId);
//         } else {
//             currentIndex++;
//         }

//         console.log(`Waiting for 2 seconds before executing next action...`);
//         setTimeout(executeNextAction, 2000);
//     }

//     executeNextAction();
// }

// async function executeActions(actions, payload) {
//     const actionResponses = {};
//     let currentIndex = 0;

//     async function executeNextAction() {
//         if (currentIndex >= actions.length) {
//             console.log('All actions completed.');
//             console.log('Final Action Responses:', actionResponses);
//             return;
//         }

//         const action = actions[currentIndex];
//         console.log(`Executing action: ${action.actionName} (ID: ${action.id})`);

//         let response;
//         let nextActionId = null;
//         const startTime = new Date(); // Track execution start time

//         try {
//             switch (action.actionType) {
//                 case 'conditional':
//                     response = await handleConditional(action, payload, actionResponses);
//                     nextActionId = response.nextActionId;
//                     actionResponses[action.actionName] = response.response;
//                     break;
//                 case 'getDataFromDB':
//                     response = await handleGetDataFromDB(action, payload, actionResponses);
//                     actionResponses[action.actionName] = response;
//                     nextActionId = action.actionDetails?.nextAction;
//                     break;
//                 case 'mapFields':
//                     response = await handleMapFields(action, payload, actionResponses);
//                     actionResponses[action.actionName] = response;
//                     nextActionId = action.actionDetails?.nextAction;
//                     break;
//                 case 'updateBusinessView':
//                     response = await handleUpdateBusinessView(action, payload, actionResponses);
//                     actionResponses[action.actionName] = response;
//                     nextActionId = action.actionDetails?.nextAction;
//                     break;
//                 case 'completed':
//                     response = await handleCompleted(action, payload, actionResponses);
//                     actionResponses[action.actionName] = response;
//                     currentIndex = actions.length; // Stop execution
//                     return;
//                 default:
//                     console.error(`Unknown action type: ${action.actionType}`);
//                     return;
//             }

//             const endTime = new Date(); // Track execution end time

//             // Log the action execution details
//             await logAction(action, payload, response, true, startTime, endTime);

//             // Determine the next index to execute
//             if (nextActionId) {
//                 currentIndex = findIndexById(actions, nextActionId);
//             } else {
//                 currentIndex++;
//             }

//             console.log(`Waiting for 2 seconds before executing next action...`);
//             setTimeout(executeNextAction, 2000);
//         } catch (error) {
//             console.error(`Error executing action: ${action.actionName}`, error);

//             const endTime = new Date(); // Track failure end time

//             // Log failed action execution
//             await logAction(action, payload, { error: error.message }, false, startTime, endTime);

//             currentIndex++; // Move to the next action
//             executeNextAction();
//         }
//     }

//     executeNextAction();
// }


// connectDB("InventoryManagement")
// .then(output => {
//     db=output
  
// collection=db.collection('pageActions')
// actions = collection.findOne({actionName:"FirstActions"});
// console.log('actions',actions)

// actions=actions.actions
// executeActions(actions, payload);

// })
// .catch(error => console.error("Error fetching data:", error));

// Example Usage
// async function logAction(action, payload, output, status, startTime, endTime) {
//     try {
//         const db = await connectDB("InventoryMangement"); // Connect to DB
//         const collection = db.collection('actionLog'); // Get the log collection

//         const logEntry = {
//             businessComponent: null,
//             businessComponentInstance: null,
//             sourceType: null,
//             sourceName: null,
//             ruleSetName: "YourRuleSetName", // You may pass this dynamically
//             payload: payload,
//             actions: [
//                 {
//                     id: action.id,
//                     actionName: action.actionName,
//                     actionType: action.actionType,
//                     input: payload,
//                     startTime: startTime,
//                     output: output,
//                     status: status,
//                     endTime: endTime
//                 }
//             ],
//             startTime: startTime,
//             endTime: endTime,
//             createdAt: new Date()
//         };

//         await collection.insertOne(logEntry); // Insert log into DB
//         console.log(`Logged action: ${action.actionName}`);
//     } catch (error) {
//         console.error("Error logging action:", error);
//     }
// }
const { ObjectId } = require('mongodb');
const dbClient = require('./config/db');

async function createLogDocument(ruleSetName, payload) {
    try {
        const db = await dbClient.connectDB("InventoryManagement");
        const collection = db.collection('actionLog');

        const logEntry = {
            businessComponent: null,
            businessComponentInstance: null,
            sourceType: null,
            sourceName: null,
            ruleSetName: ruleSetName,
            payload: payload,
            actions: [], // Empty array, actions will be added later
            startTime: new Date(),
            endTime: null, // Will be updated after all actions complete
            createdAt: new Date()
        };

        const result = await collection.insertOne(logEntry);
        return result.insertedId; // Return the document ID for updates
    } catch (error) {
        console.error("Error creating log document:", error);
        throw error;
    }
}

async function updateLogWithAction(logId, action, payload, output, status, startTime, endTime) {
    try {
        const db = await dbClient.connectDB("InventoryManagement");
        const collection = db.collection('actionLog');

        await collection.updateOne(
            { _id: new ObjectId(logId) },
            {
                $push: {
                    actions: {
                        id: action.id,
                        actionName: action.actionName,
                        actionType: action.actionType,
                        input: payload,
                        startTime: startTime,
                        output: output,
                        status: status,
                        endTime: endTime
                    }
                }
            }
        );
        console.log(`Updated log with action: ${action.actionName}`);
    } catch (error) {
        console.error("Error updating log with action:", error);
    }
}

async function finalizeLog(logId) {
    try {
        const db = await dbClient.connectDB("InventoryManagement");
        const collection = db.collection('actionLog');

        await collection.updateOne(
            { _id: new ObjectId(logId) },
            { $set: { endTime: new Date() } }
        );
        console.log("Finalized log document.");
    } catch (error) {
        console.error("Error finalizing log:", error);
    }
}

async function executeActions(actions, payload, ruleSetName ) {
    const actionResponses = {};
    let currentIndex = 0;

    // Create the log document and get its ID
    const logId = await createLogDocument(ruleSetName, payload);

    async function executeNextAction() {
        if (currentIndex >= actions.length) {
            console.log('All actions completed.');
            console.log('Final Action Responses:', actionResponses);
            await finalizeLog(logId);
            return;
        }

        const action = actions[currentIndex];
        console.log(`Executing action: ${action.actionName} (ID: ${action.id})`);

        let response;
        let nextActionId = null;
        const startTime = new Date();

        try {
            switch (action.actionType) {
                case 'conditional':
                    response = await handleConditional(action, payload, actionResponses);
                    nextActionId = response.nextActionId;
                    actionResponses[action.actionName] = response.response;
                    break;
                case 'getDataFromDB':
                    response = await handleGetDataFromDB(action, payload, actionResponses);
                    console.log('getdatafr',response)
                    actionResponses[action.actionName] = response;
                    nextActionId = action.actionDetails?.nextAction;
                    break;
                case 'mapFields':
                    response = await handleMapFields(action, payload, actionResponses);
                    actionResponses[action.actionName] = response;
                    nextActionId = action.actionDetails?.nextAction;
                    break;
                case 'updateBusinessView':
                    response = await handleUpdateBusinessView(action, payload, actionResponses);
                    actionResponses[action.actionName] = response;
                    nextActionId = action.actionDetails?.nextAction;
                    break;
                    case 'insertData':
                        response = await handleInsertISData(action, payload, actionResponses);
                        actionResponses[action.actionName] = response;
                        nextActionId = action.actionDetails?.nextAction;
                        break;
                    case 'webhook':
                        response = await handleWebhook(action, payload, actionResponses);
                        actionResponses[action.actionName] = response;
                        nextActionId = action.actionDetails?.nextAction;
                        break;
                        
            case 'executeApi':
                response = await executeApi(action, payload, actionResponses);
                actionResponses[action.actionName] = response;
                nextActionId = action.actionDetails?.nextAction;
                break;
                case 'completed':
                    response = await handleCompleted(action, payload, actionResponses);
                    actionResponses[action.actionName] = response;
                    await finalizeLog(logId);
                    return;
                    default:
                        console.warn(`Unknown action type: ${action.actionType}. Skipping to next action.`);
                        break;
            }

            const endTime = new Date();

            // Update log with executed action details
            await updateLogWithAction(logId, action, payload, response, true, startTime, endTime);

            // Determine next action
            if (nextActionId) {
                currentIndex = findIndexById(actions, nextActionId);
            } else {
                currentIndex++;
            }

            console.log(`Waiting for 2 seconds before executing next action...`);
            setTimeout(executeNextAction, 2000);
        } catch (error) {
            console.error(`Error executing action: ${action.actionName}`, error);

            const endTime = new Date();

            // Log failed action execution
            await updateLogWithAction(logId, action, payload, { error: error.message }, false, startTime, endTime);

            currentIndex++; // Move to the next action
            executeNextAction();
        }
    }

    executeNextAction();
}

let db=null;
let collection=null;
let actions
// connectDB("InventoryMangement")
//   .then(async (db) => {
//     const collection = db.collection('pageActions');
    
//     // Await the result of findOne()
//     let actionsDocument = await collection.findOne({ actionName: "FirstActions" });

//     if (!actionsDocument) {
//       console.error("No actions found for 'FirstActions'");
//       return;
//     }

//     console.log('actions', actionsDocument);

//     // Extract actions array
//     let actions = actionsDocument.actions;

//     // Execute actions
//     console.log()
//     let finaloutput=executeActions(actions, payload);
//     console.log(finaloutput)
//   })
//   .catch(error => console.error("Error fetching data:", error));


// const payload = {
//     status: 'Approve',
//     schReferenceNumber: 'SCH123',
//     headers: {
//         dbName: 'exampleDB'
//     },
//     data:{
    

//         "form_1": {
//             "materialName": "test",
//             "materialCode": "adsfkjh"
      
//         },
//             "form_2": {
          
//             "supplier": "Supplier 2",
//             "materialType": "Raw"
           
//         }
//     }
// };

module.exports={
    executeActions:executeActions
}