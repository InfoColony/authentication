import * as dotenv from "dotenv"
import express from "express"
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
import session from "express-session"
import passport from "passport"
import passportLocalMongoose from "passport-local-mongoose"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import {Strategy as FacebookStrategy} from "passport-facebook"
import findOrCreate from "mongoose-findorcreate"

dotenv.config()
const app=express()
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(express.static("public"))
app.use(session({
  secret:"ThisWillBeTheSecretUsedForSigningTheHash@1.",
  resave:false,
  saveUninitialized:false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/UserDB");


const userSchema=new mongoose.Schema({
  secret:String,
  facebookId:String,
  username:String,
  password:String,
  googleId:String
});
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User=new mongoose.model("User",userSchema)

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_S,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username:profile.displayName}, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_S,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id, username: profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/loginfail" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/loginfail' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get("/register",function(req,res){
    res.render("register")
  })
  app.get("/submit",function(req,res){

    if(req.isAuthenticated()){
      res.render("submit")
    }else{
      res.redirect("/login")
    }
  })
var hidden="hidden";

app.get("/login",function(req,res){

    res.render("login",{hide:hidden})

  hidden="hidden";
})
app.get("/loginfail",function(req,res){
  hidden="show";
  res.redirect("/login")
})
var lo="show";
app.get("/secrets",function(req,res){
  User.find({secret:{$ne: null}},function(err,results){
    if(err){
      console.log(err);
    }else{
      if(results){
        if(req.isAuthenticated()){
          lo="show"
          res.render("secrets",{userWS:results,hidel:lo})
        }else{
          lo="hidden"
          res.render("secrets",{userWS:results,hidel:lo})
        }

      }
    }
  })
})


app.get("/logout",function(req,res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/")
    }
  })
})

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register")
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets")
      })
    }
  })

  })

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
  User.findById(req.user._id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(err){
            res.redirect("/secrets")

        })
      }
    }
  })
})

app.post("/login",function(req,res){
  passport.authenticate("local",{failureRedirect: "/loginfail"})(req,res,function(){
    res.redirect("/secrets")
  })
})






app.listen(3000,function(){
  console.log("listening on port 3000");
})
