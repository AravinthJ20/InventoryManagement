const { MongoClient } = require('mongodb');

// const uri = "mongodb+srv://aravinthj388:Js9QJ4sbbMKLIHQD@cluster0.q4y15.mongodb.net/InventoryManagement?retryWrites=true&w=majority";
const uri = "mongodb+srv://aravinthj388:Js9QJ4sbbMKLIHQD@cluster0.q4y15.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const database = client.db('InventoryManagement');
    const collection = database.collection('users');
     const data=await collection.findOne()
     console.log(data)
    // Perform operations here
  } finally {
    await client.close();
  }
}

run().catch(console.dir);