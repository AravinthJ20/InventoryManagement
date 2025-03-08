const jwt=require('jsonwebtoken')
const dotenv=require('dotenv')
const dbo=require('../config/db.js')
const bcrypt=require('bcrypt')
const {connectDB}=require('../config/db.js')
dotenv.config({ path: "config.env" })
const axios=require('axios')

// Render the login page for the user
const login = ((req, res) => {
    try {
        res.render("adminLogin", (err) => {
            if (err) {
                
                if (err.message.includes("Failed to lookup view")) {
                    return res.status(404).render("404Page");
                } else {
                    return res.status(500).render("500");
                }
            }
            // res.status(200).render("adminLogin", { admin: true })
          res.sendFile(path.join(__dirname,'views','Login.html'))
        
        })
    } catch (error) {
        return res.status(500).render("500");
    }
})

// validate the admin information
const loginVerify = (async (req, res) => {
    try {
        const {user, password } = req.body
        let client=await connectDB("InventoryMangement");
    const collection=client.collection('Users')
    const validate=await collection.findOne({userid: req.body.user})
    console.log(user,password)

    const validPassword=await bcrypt.compare(password,validate.password)
console.log(validPassword)
let role=validate.role;
        if (user != validate.userid) {
            return res.status(401).json({ error: "Unauthorized Admin" })
        }
        else if (!validPassword) {
            return res.status(400).json({ error: "Wrong Password" })
        }
        else {
            const payload = { user: user, role:role }
            const token = jwt.sign(payload, "dadasdq#r@#$@#redfetq#$r%$#@rfds@!#!#3@@!#!@", {
                expiresIn: "1h",
            })

            req.session.admintoken = token
            req.session.userid=validate.userid
            req.session.role='admin';
            res.setHeader('userId',req.body.user)

            res.set({'role':'admin','roleGroup':'admin'})
            req.session.role=validate.role
            res.cookie('userRole', validate.role, { httpOnly: false, secure: true });  // Store in cookie

            const permissionResponse = await axios.get('http://localhost:3000/permission', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Role': validate.role // Pass role in the header
                }
            });

            const dynamicMenus = permissionResponse.data.menus; // Assuming /permission returns the menus

            // Store the menus in the session
            req.session.dynamicMenus = dynamicMenus;

            console.log('token', req.session.admintoken);
             console.log('Menus:', req.session.dynamicMenus);

            console.log('token',req.session.admintoken)
            res.status(200).json(token)
            // res.redirect("/views/VendorRegisteration.html")
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: "Internal Server error please try again later" })
    }

})

// delete the admin session while admin logout
const logout = ((req, res) => {
    try {
        delete req.session.admintoken
        res.redirect("/")

    } catch (error) {
        return res.status(500).render("500");
    }
})

function isLogged(req, res, next) {
   
    try {
        if (req.session.admintoken) {
             next()
         } else {
             res.redirect("/")
         }
     } catch (error) {
         console.log(error)
     }

}
const islogout = ((req, res, next) => {

    try {
        if (!req.session.admintoken) {
            next()
        } else {
            res.redirect("/views/Login.html")
        }
    } catch (error) {
        console.log(error)
    }

})

const adminLogin=async (req,res)=>{

    console.log(req.headers.origin,req.headers.host)
    let client=await connectDB("InventoryMangement");
    const collection=client.collection('Users')
   try{
    const validate=await collection.findOne({user: req.body.user})
   console.log('users',req.body.user)
    if(!validate){
        // return res.send('invalid user')
       return res.send('<script>alert("Invalid user!"); window.location.href = "/";</script>');

        // res.send('invalid user')
    }

     const validPassword=req.body.password==="Password@123"
     console.log( validPassword)
       if(!validPassword){
       
    //       // return res.send('invalid password')
    //        //           res.send('invalid password')
           return res.send('<script>alert("Pleade enter valid password!"); window.location.href = "/";</script>');

      }
     res.setHeader('userId',req.body.user)
     res.set({'role':'admin','roleGroup':'admin'})
     req.session.role=validate.role
      res.redirect('/views/LandingPage.html')
    }
    
      catch(err){
res.send('something went wrong')
      }
      console.log('done')
}

module.exports={
    login,
    loginVerify,
    logout,
    isLogged,
    adminLogin,
    islogout
    
}