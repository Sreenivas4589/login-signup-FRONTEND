const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

app.use(cors());

const userRoute = require("./routes/index");

// const mongoURI = "mongodb://localhost:27017/BlockchainPOC";

//connnect to DB

mongoose
  .connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true, // not supported
  })
  .then((result) => {
    console.log("Connected to DB");
  })
  .catch((err) => console.log(err));

//middlewares
app.use(bodyParser.json());
app.use("/api/user", userRoute);

app.listen(1001, () => console.log("Server running at 4000..."));
