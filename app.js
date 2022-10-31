import * as dotenv from "dotenv"
import express from "express"
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
import encrypt from "mongoose-encryption"

dotenv.config()
const app=express()
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(express.static("public"))
mongoose.connect("mongodb://localhost:27017/UserDB");


const userSchema=new mongoose.Schema({
  userName:String,
  password:String
});
console.log(process.env.SECRETS);
userSchema.plugin(encrypt,{secret:process.env.SECRETS,encryptedFields:["password"]})

const User=new mongoose.model("User",userSchema)

app.get("/",function(req,res){
  res.render("home")
})

app.get("/register",function(req,res){
  res.render("register")
})
var hidden="hidden";

app.get("/login",function(req,res){
  res.render("login",{hide:hidden})
  hidden="hidden";
})

app.post("/register",function(req,res){
  const n_user=new User({
    userName:req.body.username,
    password:req.body.password
  })
  n_user.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets")
    }
  })
})

app.post("/login",function(req,res){
  const username=req.body.username
  const password=req.body.password
  User.findOne({userName:username},function(err,foundUser){
    if(foundUser){
      console.log(foundUser);
      if(foundUser.password==password){
        res.render("secrets")
      }else{
        hidden="show"
        res.redirect("/login")
      }
    }else{
      console.log(err);
    }
  })
})






app.listen(3000,function(){
  console.log("listening on port 3000");
})
