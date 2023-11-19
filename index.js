const express = require("express");
const app = express();
const PORT = 3002;
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// conncet mongoDB to mongoClient
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL = process.env.DB;
const DB = "RecipeApp";

// middleware
app.use(express.json());
app.use(cors({ origin: "*" }));



// Register
app.post("/register", async function (req, res) {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);
    const salt = await bcrypt.genSalt(10);
    // console.log(salt); //$2a$10$j06pPIoiAuae66tENIJjiu
    let hash = await bcrypt.hash(req.body.password, salt);
    // console.log(hash); // random salt + password=$2a$10$j06pPIoiAuae66tENIJjiuov423TknXYlxsazm0VaMqaIOdCUza82
    req.body.password = hash;
    await db.collection("userRegister").insertOne(req.body);
    await connection.close();
    res.json({ message: "register successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});
// authendicate
let authendicate = (req, res, next) => {
  if (req.headers.authorization) {
    try {
      let decode = jwt.verify(req.headers.authorization, process.env.SECRET);
      if (decode) {
        next();
      }
    } catch {
      res.status(401).json({ message: "UNATHORIZED" });
    }
  } else {
    res.status(401).json({ message: "UNATHORIZED" });
  }
};
// Login
app.post("/login", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);
    const user = await db
      .collection("userRegister")
      .findOne({ email: req.body.email });

    if (user) {
      let compare = await bcrypt.compare(req.body.password, user.password);

      if (compare) {
        let token = jwt.sign({ _id: user._id }, process.env.SECRET, {
          expiresIn: "2m",
        });
        res.json({ token });
      } else {
        res.status(401).json({ message: "email/username not found" });
      }
    } else {
      res.status(401).json({ message: "email/username not found" });
    }
    await connection.close();
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong");
  }
});











// get user recipe
app.get("/getrecipes", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);
    const getRecipes = await db
      .collection("createUserRecipes")
      .find()
      .toArray();
    console.log(getRecipes);
    connection.close();
    res.json(getRecipes);
  } catch (e) {
    res.status(500).json("something went wrong");
  }
});

// post user Recipes
app.post("/createrecipe", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    // console.log("Connection Object:", connection);
    const db = connection.db(DB);
    const createRecipe = await db
      .collection("createUserRecipes")
      .insertOne(req.body);
    // console.log("Request Body:", req.body);
    connection.close();
    res.status(200).json("Recipe Created");
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// get by id

app.get("/userrecipe/:id", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);
    const getRecipe = await db
      .collection("createUserRecipes")
      .findOne({ _id: new mongodb.ObjectId(req.params.id) });
    connection.close();
    res.json(getRecipe);
  } catch (e) {
    res.status(500).json("something went wrong try again later");
  }
});

// put method

app.put("/updatedrecipe/:id", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);
    const updatedRecipe = await db
      .collection("createUserRecipes")
      .findOneAndUpdate(
        { _id: new mongodb.ObjectId(req.params.id) },
        { $set: req.body }
      );
    connection.close();
    res.json("Recipe Updated");
  } catch (e) {
    res.status(500).json("something went wrong try again later");
  }
});
// delete method
app.delete("/deleterecipe/:id", async (req, res) => {
  try {
    const connection = await mongoClient.connect(URL);
    const db = connection.db(DB);
    await db
      .collection("createUserRecipes")
      .findOneAndDelete({ _id: new mongodb.ObjectId(req.params.id) });
    connection.close();
    res.status(200).json("Recipe Successfully Deleted");
  } catch (e) {
    res.status(500).json("something went wrong try again later");
  }
});


app.listen(PORT, () => {
  console.log(`App listening port on ${PORT}`);
});
