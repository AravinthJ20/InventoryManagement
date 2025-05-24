const jwt=require('jsonwebtoken')
const dotenv=require('dotenv')
const dbo=require('../config/db.js')
const primary=require('../controllers/keyGenerator.js')
const path=require('path')
const axios=require('axios')
require('dotenv').config()


const supplierRoutes=(req,res)=>{
  let viewName = req.params.viewname;
  viewName = path.basename(viewName, path.extname(viewName)); 

  try{
      console.log('view',req.params.viewname)
      res.sendFile(path.join(__dirname, '../views', `${viewName}.html`), (err) => {
        if (err) {
            // If .html is not found, try .htm
            res.sendFile(path.join(__dirname, '../views', `${viewName}.htm`), (err2) => {
                if (err2) {
   res.render("404Page");
                }
            });
        }
    });
// res.render(req.params.viewname)
  }
  catch(err){
      res.status(500).send(err)
  }
}

const supplierRoutes2=(req,res)=>{
    let viewName = req.params.viewname.split('.')[0]; // Remove everything after the first "."
    viewName = path.basename(viewName, path.extname(viewName)); 
  
    try{
    //     console.log('view',req.params.viewname)
    //     res.sendFile(path.join(__dirname, '../views', `${viewName}.html`), (err) => {
    //       if (err) {
    //           // If .html is not found, try .htm
    //           res.sendFile(path.join(__dirname, '../views', `${viewName}.htm`), (err2) => {
    //               if (err2) {
    //  res.render("404Page");
    //               }
    //           });
    //       }
    //   });
  // Try rendering the view
  res.render(viewName, (err, html) => {
    if (err) {
        // If there's an error (e.g., view not found), render the 404 page
        return res.render("404Page");
    }
    res.send(html); // Send the successfully rendered HTML
})}
    catch(err){
        res.status(500).send(err)
    }
  }


module.exports={

    supplierRoutes,
    supplierRoutes2
}