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
const {executeActions}=require('./controllers/ActionsExecuter.js')
const adminAuth=require('./controllers/Auth')
const supplierRoutes=require('./routes/supplierRoutes')
const workflow=require('./routes/workflow')
const _ = require('lodash');
const { deepStrictEqual } = require('assert')
const userRoutes=require('./routes/userRoutes')
const masterRoutes=require('./routes/masterRoutes.js')

const service=require('./routes/services.js')
const apiServices=require('./routes/apiService.js')
app.use(express.json())
const MongoStore = require('connect-mongo');
app.use(express.urlencoded({ extended: true }));
// app.use(morgan('combined')) morgan log on hold
// app.use(session({
//   secret: 'your-secret-key',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { maxAge: 200 * 60 * 10000 }
//   // cookie: { maxAge: 20 * 60 * 10000 } // 2 minutes cookie: { secure: false } // Set to true if using HTTPS
// }));

// Add this after connectDB configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, // Your MongoDB connection string
    collectionName: 'sessions'
  }),
  cookie: { 
    maxAge: 200 * 60 * 10000, // 200 minutes
    secure: false // Set to true in production with HTTPS
  }
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
app.use(express.static(path.join(__dirname,'public')))
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
app.use('/',masterRoutes)

app.use('/workflow-engine',workflow)
app.use('/userRoutes',userRoutes)
app.use('/admin',service)
app.use('/userRoutes',apiServices)
app.get('/index',(req,res)=>{res.render('HomePage')})
app.get('/inbox',(req,res)=>{res.render('inbox')})


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