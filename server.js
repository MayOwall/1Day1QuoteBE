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

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  next();
});

// body-parser
app.use(bodyParser.json());

// login (로그인)
const loginRouter = require("./router/login");
app.use("/login", loginRouter);

// profile
const profileRouter = require("./router/profile");
app.use("/profile", profileRouter);

// image
const imageRouter = require("./router/image");
app.use("/image", imageRouter);

// quoteCard
const quoteCardRouter = require("./router/quoteCard");
app.use("/quoteCard", quoteCardRouter);

app.route("/").get((req, res) => res.send("Hello, Bookstack 📚"));
