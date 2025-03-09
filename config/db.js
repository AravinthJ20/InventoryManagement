const mongodb=require("mongodb")
const MongoClient=mongodb.MongoClient;
require('dotenv').config()
const MONGO_URI=process.env.MONGO_URI
let test=2;

async function connectDB(database){
    try{

    // const client=await MongoClient.connect('mongodb://127.0.0.1:27017/')
    const client=await MongoClient.connect(MONGO_URI)

    const dbList=await client.db().admin().listDatabases();
    // console.log('dbList',dbList)
const dbName=database;
    const dbExists=dbList.databases.some(db=>{
        // console.log(db.name,dbName)

        db.name==dbName
    })
    console.log(dbExists)
if(dbName){
    try{
    const db=client.db(dbName)

    // console.log('server connected',db)
return db;
}
catch(error){
    console.log('unable to connect db')
    return error;
}

}

else{
    console.log('db not connected')
    return 'db not found'
}}
catch(error){
    console.error('error',error)
    throw error;
}
}

module.exports={

    connectDB:connectDB
}