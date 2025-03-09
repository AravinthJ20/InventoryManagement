const { connectDB } = require('../config/db')
const path = require('path')
const express = require('express')
const app = express()
const { executeActions } = require('../ActionsExecuter')
const axios = require('axios')
const router = express.Router()
const {ObjectId}=require('mongodb')
require('dotenv').config()
const MONGO_URI=process.env.BASE_URL

router.post('/workflowTrigger', async (req, res) => {
  try {

    const client = await connectDB("InventoryMangement");
    const primaryKey = req.body.primaryKey;
    // console.log(req.body)
    console.log('workflow called')

    const workflowRules = await client.collection('workflow_rules').find().toArray();
    const rule1 = await client.collection('workflow_rules').findOne({ stepId: 1,workflowId:"dbflow"})
    console.log(rule1)
    let currentApprover = rule1.approvers[0];

    await client.collection('workitems').insertOne({
      productId: primaryKey,
      level: rule1.level,
      status: 'pending',
      currentStepId: rule1.stepId,
      approver: currentApprover,
      workflowId: 'dbflow',
      Decisions: rule1.Decisions

    });
    res.json('workflow triggered')
  }
  catch (err) {

    console.log(err)
  }
})
router.post('/triggerWorkFlow', async (req, res) => {
  const db = await connectDB("InventoryMangement");
  const productId = req.body.productId;
  const approver = req.body.approver; // Assuming approver is sent in the request body

  try {
    // Update status of work item for the current product and approver
    console.log(req.body)
    const closeCheck = await db.collection('workitems').findOne({ productId: productId, status: "closed", level: "System" });
    var flag = !closeCheck
    console.log(flag)
    console.log(req.body)
    if (flag == true) {
      axios.post(`${BASE_URL}/workflow-engine/initApi`, req.body)

      const Approver = await db.collection('workitems').findOne({ productId: productId, status: "pending" });
      console.log("approver", Approver)

      const nxtApprover = Approver.workflowId
      const apprlvl = Approver.currentStepId
      let statusCheck = req.body.action == "Approve" ? "approved" : "rejected"
      console.log(statusCheck, "stauts")
      await db.collection('workitems').updateOne(
        { productId: productId, approver: approver, status: 'pending' },
        { $set: { status: statusCheck, decision: req.body.action } }, { upsert: true }
      );
      const Approver2 = await db.collection('workflow_rules').findOne({ workflowId: nxtApprover, stepId: apprlvl });
      const nextstpid = Approver2.next_Step[req.body.action]
      console.log("netApprover", nextstpid)
      const Approver3 = await db.collection('workflow_rules').findOne({ stepId: nextstpid });
      console.log("netApprover", Approver3.approvers, Approver3.nextApprover)
      if (Approver3.level != "System") {
        const updateOpenItem = await db.collection('workitems').insertOne(
          {
            productId: productId, approver: Approver3.approvers[0], level: Approver3.level,
            workflowId: "dbflow", status: "pending", currentStepId: Approver3.stepId, Decisions: Approver3.Decisions
          }



        )
        axios.post(`${BASE_URL}/workflow-engine/SupplierWorkflowMail`, req.body)


      }
      else {
        console.log("WF Closed")
        await db.collection('workitems').insertOne(
          {
            productId: productId, approver: Approver3.level, level: Approver3.level,
            workflowId: "dbflow", status: "closed"
          }

        )
        await db.collection('medicine').updateOne(
          { supplier_id: productId }, { "$set": { status: 'approved' } }

        )
      }
      // Log the approval action
      await db.collection('workflow_logs').insertOne({
        productId: productId,
        actionType: 'approve',
        userId: approver,
        timestamp: new Date()
      });
      res.status(200).json({ message: 'Approval action recorded' });
    }
    else {

      console.log("workflow already closed this product")
      res.status(200).json({ message: 'workflow already closed this product' });
    }


  } catch (error) {
    console.error('node Error:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await db.client.close();
  }
});
router.post('/initApi', async (req, res) => {
  console.log('init called', req.body)

  axios.post(`${BASE_URL}/workflow-engine/initApi`, req.body)

  const db = await connectDB("InventoryMangement");
  const productId = req.body.productId
  let statusCheck;
  if (req.body.approver == "packingteam") {

    statusCheck = req.body.action == "Approve" ? "Pending for Approval" : "Rejected"

  }
  else if (req.body.approver == "deliveryTeam") {

    statusCheck = req.body.action == "Approve" ? "onboarded" : "Rejected"

  }

  else {

    statusCheck = req.body.action == "Approve" ? "Submitted" : "Rejected"

  }

  const result = await db.collection('Suppliers').updateOne(
    { vendorId: productId },
    { $set: { deliveryStatus: statusCheck } }
  );
  console.log("init completed")
  res.status('200')
})
// router.post('/SupplierWorkflowMail',async(req,res)=>{
//   console.log('SupplierWorkflowMail_Post Api called',req.body)
// })
router.post('/SupplierWorkflowMail', async (req, res) => {
  const db = await connectDB("InventoryMangement");
  const collection = db.collection('pageActions');
  let payload = req.body;


  let actionsDocument = await collection.findOne({ actionName: "FirstActions" });
  let actions = actionsDocument.actions;

  executeActions(actions, payload)
  console.log('Workflow Post Api Called')
})


router.post('/PublishWorkflow',async (req, res) => {
  try {

    const client = await connectDB("InventoryMangement");
    const primaryKey = req.body.primaryKey;
    const {Workflow_Id,InstanceId}=req.body
    // console.log(req.body)
    console.log('workflow called')

    const eventData = await client.collection('eventTrigger').find({WorkFlow_Id:Workflow_Id}).toArray();
    const Start_Step_Id=eventData[0].Start_Step_Id
     const ruleData = await client.collection('workflow_rules').findOne({ stepId: Start_Step_Id,workflowId:Workflow_Id })
    // let currentApprover = rule1.approvers[0];
    console.log('eventData',ruleData)
const {Step_Type,level,stepId,Decisions}=ruleData

let currentApprover = ruleData.approvers[0];

if(Step_Type=="User_Task"){
  console.log("user task called")
    await client.collection('workitems').insertOne({
      InstanceId: InstanceId,
      level: level,
      status: 'pending',
      currentStepId:stepId,
      approver: currentApprover,
      workflowId: Workflow_Id,
      Decisions:Decisions

    });
   
}
else if(Step_Type=="Api_Task"){

}
else if(Step_Type=="completion_Task"){

}
else if(Step_Type=="conditional_Task"){

}
else{
  console.log('unknown task')
}
  
    res.json('workflow triggered')
  }
  catch (err) {

    console.log(err)
  }
})

router.post('/actionOnWorkItem',async(req,res)=>{
  const db = await connectDB("InventoryMangement");
  const InstanceId = req.body.Business_Comp_Instance_Id;
  const approver = req.body.User_Agent; // Assuming approver is sent in the request body
  const workItemId=req.body.Work_Item_Id
  const userAction=req.body.Action
   const Workflow_Id=req.body.Workflow_Id

   const closeCheck = await db.collection('workitems').findOne({ InstanceId: InstanceId, status: "closed", level: "System" });
   var flag = !closeCheck
   console.log('close flag',flag)
 
 
   if (flag == true){
    try {


     
      
      const currentAction= await db.collection('workitems').findOne({ InstanceId: InstanceId, _id:new ObjectId(workItemId)   });
    
    const updateDecision=await db.collection('workitems').updateOne(
      { InstanceId: InstanceId, _id:new ObjectId(workItemId) },
      { $set: { status:'closed' } }
    );
    
    const currentStepId = currentAction.currentStepId
    const currentRule= await db.collection('workflow_rules').findOne({ stepId: currentStepId,workflowId: Workflow_Id });
          
    const PostAPI=currentRule.post_Activity_api
    const postAPI_Payload=currentRule.post_Activity_api_payload
    postAPI_Payload.actionName=postAPI_Payload.rulesetName

    if(PostAPI!=""){
      console.log('pre api called',postAPI_Payload)
      const collection2 = db.collection('pageActions');
     
    
      let actions = actionsDocument.actions;
let actionName= postAPI_Payload.actionName 
      let actionsDocument = await collection2.findOne({ actionName:  postAPI_Payload.actionName });
     await executeActions(actions,postAPI_Payload,actionName)
      // axios.post(`http://localhost:3000${PostAPI}`, postAPI_Payload)
    
    }
    else{console.log('empty post api')}
    
    
    const Next_Step_Id = currentRule.next_Step[userAction]
    
          const NextTask = await db.collection('workflow_rules').findOne({ stepId: Next_Step_Id });
    
    
    
          if (NextTask.Step_Type != "Completion_Task") {
            const updateOpenItem = await db.collection('workitems').insertOne(
              {
                InstanceId: InstanceId, approver: NextTask.approvers[0], level: NextTask.level,
                workflowId:Workflow_Id, status: "pending", currentStepId: NextTask.stepId, Decisions: NextTask.Decisions
              }
    
    
    
            )
    
            const PreAPI=currentRule.post_Activity_api
    
            let  PreAPI_Payload=currentRule.prev_Activity_api_payload
 
            if(PostAPI!=""){
              axios.post(`http://localhost:3000${PreAPI}`, PreAPI_Payload)
            
            }
            else{console.log('empty post api')}
            
    
            res.status(200).json({ message: 'action completed' });

          }
          else {
            console.log("WF Closed")
            await db.collection('workitems').insertOne(
              {
                InstanceId: InstanceId, approver: NextTask.level, level: NextTask.level,
                workflowId: Workflow_Id, status: "closed"
              }
    
            )
            res.status(200).json({ message: 'action completed' });

          }
    
    } catch (error) {
      console.error('node Error:', error);
      res.status(500).send('Internal Server Error');
    }
   }
else{
  console.log("workflow already closed this product")
      res.status(200).json({ message: 'workflow already closed this product' });
}








 
})


router.post('/preApi',(req,res)=>{
  console.log('pre api called')
  res.status(200)
})

router.post('/postApi',(req,res)=>{
  console.log('post api called')
  res.status(200)
})
module.exports = router