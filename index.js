const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userRegistration = require("./routes/registration.route");
const userLogin = require("./routes/login.route");
const billingList = require("./routes/billingList.route");
const addBilling = require("./routes/addBilling.route");
const updateBiling = require("./routes/updateBilling.route");
const deleteBiling = require("./routes/deleteBilling.route");

// express app initialization
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// application routes
app.use("/api/registration", userRegistration);
app.use("/api/login", userLogin);
app.use("/api/billing-list", billingList);
app.use("/api/add-billing", addBilling);
app.use("/api/update-billing/", updateBiling);
app.use("/api/delete-billing/", deleteBiling);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
