require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Himanshu1109:"+process.env.pass+"@cluster0.9wrto.mongodb.net/users", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema ({
    username: String,
    password: String,
    age: {
        type: Number,
        default: 0
    },
    gender: {
        type: String,
        default: "Male"
    },
    dob: {
        type: String,
        default: "1/1/1999"
    },
    mobile: {
        type: Number,
        default: 000000000
    }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user,done)=>{
    done(null, user.id);
});

passport.deserializeUser((id, done)=>{
    User.findById(id, (err, user)=>{
        done(err, user);
    });
});

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/profile", (req, res)=>{
    if(req.isAuthenticated()){
        User.findById(req.user.id, (err, foundUsers)=>{
            if(err){
                console.log(err);
            }
            else{
                if(foundUsers){
                    res.render("profile", {userP: foundUsers});
                }
            }
        });
    }
    else{
        res.redirect("/login");
    }
});

app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit", (req, res)=>{

    User.findById(req.user.id, (err, foundUser)=>{
        if(err){
            console.log(err);
        }
        else{
            if (foundUser){
                foundUser.age = req.body.age,
                foundUser.gender = req.body.gender,
                foundUser.dob = req.body.dob,
                foundUser.mobile = req.body.mobile
                foundUser.save(()=>{
                    res.redirect("/profile");
                });
            }
        }
    });
});

app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/");
});

app.post("/register", (req, res)=>{
    if(req.body.password === req.body.confirm){
        User.register({username: req.body.username}, req.body.password, (err,user)=>{
            if(err){
                console.log(err);
                res.redirect("/register");
            }
            else{
                passport.authenticate("local")(req, res, ()=>{
                    res.redirect("/profile");
                });
            }
        });
    }
    else{
        res.render("register");
    }
});

app.post("/login", (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/profile");
            });
        }
    });
});

app.listen(process.env.PORT || 4000, ()=>{
    console.log("Server started on port 4000");
});