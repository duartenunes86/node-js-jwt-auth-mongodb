const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");

const app = express();

// Enable CORS for all origins
app.use(cors());

// Additional middleware to log the response headers
// This is for debugging purposes and should be removed or adjusted for production
app.use((req, res, next) => {
  const defaultWrite = res.write;
  const defaultEnd = res.end;
  const chunks = [];
  res.write = function (chunk) {
    chunks.push(chunk);
    return defaultWrite.apply(res, arguments);
  };
  res.end = function (chunk) {
    if (chunk) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    console.log(req.path, body); // Log the body of the response
    res.setHeader('Content-Length', Buffer.byteLength(body));
    defaultEnd.apply(res, arguments);
  };
  next();
});

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Enable preflight requests for all routes
app.options('*', cors());

const db = require("./app/models");
const Role = db.role;

// Connect to MongoDB
db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// Simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

// Routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// Set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

// Function to initialize roles in the database
function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (err) {
      console.error("Role initialization error", err);
      return;
    }
    
    if (count === 0) {
      new Role({ name: "user" }).save(err => {
        if (err) {
          console.error("error", err);
        }
        console.log("added 'user' to roles collection");
      });

      new Role({ name: "moderator" }).save(err => {
        if (err) {
          console.error("error", err);
        }
        console.log("added 'moderator' to roles collection");
      });

      new Role({ name: "admin" }).save(err => {
        if (err) {
          console.error("error", err);
        }
        console.log("added 'admin' to roles collection");
      });
    }
  });
}