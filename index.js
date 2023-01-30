const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@powerh.9sr3bmn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// connect db
async function run() {
  try {
    const userCollection = client.db("users").collection("userData");
    const billCollections = client.db("allBills").collection("userBill");

    // API endpoint for registration new user
    app.post("/registration", async (req, res) => {
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = {
          name: req.body.name,
          email: req.body.email,
          password: hashedPassword,
        };
        await userCollection.insertOne(newUser);
        res.status(200).json({
          message: "Signup was successful!",
        });
      } catch {
        res.status(500).json({
          message: "SIgnup failed!",
        });
      }
    });

    // API endpoint for login user
    app.post("/login", async (req, res) => {
      try {
        const user = await userCollection.findOne({ email: req.body.email });

        if (user && user.email) {
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
            res.send({ token });
          } else {
            res.status(401).send({
              error: "Invalid Email or Password",
            });
          }
        } else {
          res.status(401).send({
            error: "Invalid Email or Password",
          });
        }
      } catch {
        res.status(401).send({
          error: "Invalid Email or Password",
        });
      }
    });

    // API endpoint for getting all bills
    app.get("/billing-list", checkLogin, async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      const query = {};
      const cursor = billCollections.find(query).sort({ date: -1 });
      const result = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      const count = await billCollections.estimatedDocumentCount();
      res.send({ count, result });
    });

    // API endpoint for add billing
    app.post("/add-billing", async (req, res) => {
      const newBill = req.body;
      const result = await billCollections.insertOne(newBill);
      res.send(result);
    });

    // API end point for update bill using query
    app.put("/update-billing", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: ObjectId(id) };
      const update = req.body;

      const option = { upsert: true };
      const updateBilling = {
        $set: {
          name: update.updateBilling.name,
          email: update.updateBilling.email,
          phone: update.updateBilling.phone,
          payable: update.updateBilling.payable,
        },
      };
      const result = await billCollections.updateOne(
        filter,
        updateBilling,
        option
      );
      res.send(result);
    });

    // API endpoint for delete bill
    app.delete("/delete-billing/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await billCollections.deleteOne(query);
      res.send(result);
    });
  } catch (error) {
    res.status(401).send(error.name, error.message);
  }
}
run();

app.get("/", (req, res) => {
  res.send("Server is up and runing!");
});

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
