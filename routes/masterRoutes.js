const express = require('express')
const router = express.Router()
const path=require('path')
const XLSX = require('xlsx');
const adminAuth=require('../controllers/Auth')
const supplierRoutes=require('./supplierRoutes')
const {connectDB}=require('../config/db')

const masterRoutes=require('../controllers/master')

router.post('/PostData',masterRoutes.PostData)
router.get("/adminLogin",adminAuth.islogout,adminAuth.login)
router.get("/logout",adminAuth.logout)
router.post("/adminLoginTest",adminAuth.loginVerify)
router.post('/adminLogin',adminAuth.adminLogin)

router.get('/fetchPageData2', masterRoutes.fetchPageData2);
router.post('/fetchPageData', masterRoutes.fetchPageData);
router.post('/loadFilter',masterRoutes.loadFilter);
router.post('/callAggregationBusinessView',masterRoutes.callAggregationBusinessView );
router.post('/callBusinessView',masterRoutes.callBusinessView );
router.post('/executeRules',masterRoutes.executeRules )
router.get('/',async (req,res)=>{

    // res.sendFile(path.join(__dirname,'views','Home.html'))
    res.render('Home')
})
router.get('/views/:viewname',adminAuth.isLogged,supplierRoutes.supplierRoutes2)
router.get('/pages/:viewname',adminAuth.isLogged,supplierRoutes.supplierRoutes)
router.get('/popups/:pop', (req, res) => {
  console.log(req.params)
  let popupupName=req.params.pop
  res.sendFile(path.join(__dirname, '..views', popupupName))
});


router.get('/getProductDetails',async(req,res)=>{
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
router.get('/permission',async (req, res, next) => {
    const userRole = req.headers.role; // This would typically come from user session
    let client=await connectDB("InventoryMangement");

console.log('permission api',userRole)
  
        const permissions = await client.collection('Permissions').findOne({ role: userRole });
        // console.log('permissions',permissions)
       if(permissions!=null){
        try{
        const settings = await client.collection('Settings').find().toArray();
        // console.log('Settings:', JSON.stringify(settings, null, 2));
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
router.get('/workflowlog',(req,res)=>{
  // res.sendFile(path.join(__dirname,'views','workflowlog.html'))
  res.render('workflowlog')
})

module.exports = router