require("dotenv").config();
const { PORT, MONGODB_ID, MONGODB_PASSWORD } = process.env;
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${MONGODB_ID}:${MONGODB_PASSWORD}@cluster0.sjgsexl.mongodb.net/?retryWrites=true&w=majority`;

const mongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await mongoClient.connect();
    await mongoClient.db("1day1quote").command({ ping: 1 });
    app.db = mongoClient.db("1day1quote");
    app.listen(PORT || 8080, () =>
      console.log("🚀 1Day1Quote BE Server is Running")
    );
  } catch (e) {
    console.log(e);
  }
}
run();

// body-parser
app.use(bodyParser.json());

// login (로그인)
const loginRouter = require("./router/login");
app.use("/login", loginRouter);

// profile
const profileRouter = require("./router/profile");
app.use("/profile", profileRouter);

app.route("/").get((req, res) => res.send("Hello, Bookstack 📚"));
