const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const checkLogin = require("./middlewares/checkLogin");

// express app initialization
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB deployment's connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

// connect db
async function run() {
  try {
    await client.connect();
    console.log("Database connected");

    const userSignUp = client.db("users").collection("userData");
    const bills = client.db("allBills").collection("userBill");

    // API endpoint for registration new user
    app.post("/api/registration", async (req, res) => {
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
        };
        await userSignUp.insertOne(newUser);
        res.status(200).json({
          message: "Signup was successful!",
        });
      } catch {
        res.status(500).json({
          message: "SIgnup failed!",
        });
      }
    });

    // login
    app.post("/api/login", async (req, res) => {
      try {
        const user = await userSignUp.findOne({ email: req.body.email });

        if (user) {
          const isValidPassword = await bcrypt.compare(
            req.body.password,
            user.password
          );

          if (isValidPassword) {
            // generate token
            const token = jwt.sign(
              {
                email: user.email,
                userId: user._id,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: "1h",
              }
            );
            res.status(200).json({
              "access-token": token,
              message: "Login successfull!",
            });
          } else {
            res.status(401).json({
              error: "Authentication failed!",
            });
          }
        } else {
          res.status(401).json({
            error: "Authentication failed!",
          });
        }
      } catch {
        res.status(401).json({
          error: "Authentication failed!",
        });
      }
    });

    // API endpoint for add billing
    app.post("/api/billing-list", async (req, res) => {
      const newBill = req.body;
      const result = await bills.insertOne(newBill);
      res.send(result);
    });

    // API endpoint for getting all bills
    app.get("/api/billing-list", checkLogin, async (req, res) => {
      console.log(req.email, req.userId);
      //   const query = {};
      //   const result = await bills.find(query).toArray();
      res.send("hi");
    });
  } catch (error) {
    console.log(error.name, error.message);
  }
}
run();

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
