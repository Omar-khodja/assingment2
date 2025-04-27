const express = require("express");
const path = require("path");
require('dotenv').config();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
app.disable('etag');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "main")));

const usersFile = path.join(__dirname, "data.json");


    app.use(session({
        name: "myapp_session",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true, 
            maxAge: 1000 * 60 * 60 * 1
        }
      
        
    }));

function  loadUsers() {
    if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile);
        return JSON.parse(data);
    }
    return [];
}
let users = loadUsers();
 function saveUsers()  {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      
}



app.post("/1_ver",(req,res)=>{
    const {username ,password} = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if(user){
        req.session.user = username
       return res.json({success : true , message:"looged in"});
    }
    res.status(410).json({ success: false, message: "Invalid credentials" })

});
app.get("/ReqData",async (req,res)=>{
    users = await loadUsers();
    const user = users.find(u => u.username === req.session.user);
    if(user){
        res.json({success:true,username:user.username , role: user.role });
    }else{
        res.status(403).json({ success: false, message: "Not logged in or session expired." });
    }

});

app.get("/ReqUsers", async (req, res) => {
    users = await loadUsers();
    res.json({ users });

});
app.get("/admin-roles",async (req, res) => {
    users = loadUsers();
    const referer = req.get("Referer");
    const {username ,action} = req.query
    const admin = users.find(u => u.username === req.session.user);
    const user = users.find(u => u.username===username);
    if (!referer || !referer.startsWith("http://localhost:3000/adminpanel")){
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    if(!user){
        return res.status(404).json({ success: false, message: "User not found" });
    }
    if(!admin ) {
        return res.status(404).json({ success: false, message: "Unauthorized" });
    }
    

        console.log(user.role)
    if (user.role === "Normal" && action === "upgrade") {
            user.role = "Admin"
             saveUsers()
        return res.json({ success: true, message: "upgrade done" })
    
        }else if (user.role === "Admin" && action === "downgrade"){
            user.role = "Normal"
            saveUsers()
            return res.json({ success: true, message: "Downgrade done"})     
        }
            
            return res.json({ success: false, message: "User already has that role" });  
      
    
    


});


app.get("/adminpanel", (req, res) => {
    users = loadUsers(); 
    const user = users.find(u => u.username === req.session.user);

    if (user && user.role === "Admin") {
        res.sendFile(path.join(__dirname, "main", "admin.html"));
    } else {
        res.status(403).send("Access Denied");
    }
});

app.get("/myaccount",(req,res)=>{
    res.sendFile(path.join(__dirname,"main", "myaccount.html"));
})
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "login.html"));
})


app.post('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie("verify");
    res.clearCookie("myapp_session");
    res.json({ success: true, message: "Logged out successfully" });
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "main", "login.html"));
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});