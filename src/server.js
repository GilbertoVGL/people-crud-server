const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const epilogue = require("epilogue");
const OktaJwtVerifier = require("@okta/jwt-verifier");

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: "0oagf2hqf2vmifUph356",
  issuer: "https://dev-840470.okta.com/oauth2/default"
});

let app = express();
app.use(cors());
app.use(bodyParser.json());

// verify JWT token middleware
app.use((req, res, next) => {
  // require every request to have an authorization header
  if (!req.headers.authorization) {
    return next(new Error("Authorization header is required"));
  }
  let parts = req.headers.authorization.trim().split(" ");
  let accessToken = parts.pop();
  oktaJwtVerifier
    .verifyAccessToken(accessToken)
    .then(jwt => {
      req.user = {
        uid: jwt.claims.uid,
        email: jwt.claims.sub
      };
      next();
    })
    .catch(next); // jwt did not verify!
});

let database = new Sequelize({
  username: "root",
  password: "123",
  database: "crud_sequelize",
  host: "127.0.0.1",
  dialect: "mysql",
  logging: false,
  define: {
    timestamps: false
  }
});

// Define our People model
let People = database.define("peoples", {
  name: Sequelize.STRING,
  sex: Sequelize.STRING,
  street: Sequelize.STRING,
  city: Sequelize.STRING,
  district: Sequelize.STRING,
  state: Sequelize.STRING,
  addressnumber: Sequelize.STRING,
  email: Sequelize.STRING
});

// Initialize epilogue
epilogue.initialize({
  app: app,
  sequelize: database
});

// Create the dynamic REST resource for our People model
let userResource = epilogue.resource({
  model: People,
  endpoints: ["/peoples", "/peoples/:id"]
});

// Resets the database and launches the express app on :8081 database.sync({ force: true })
database.sync().then(() => {
  app.listen(8081, () => {
    console.log("listening to port localhost:8081");
  });
});
