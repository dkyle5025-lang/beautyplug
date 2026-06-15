const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const dbconn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tendamema",
  database: "beautyplug",
  port: 3306,
});
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies - postman, API clients- fetch, axios, etc.
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies -  browser form submissions

app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});
app.get("/service-providers", (req, res) => {
  dbconn.query("SELECT * FROM service_providers", (err, results) => {
    if (err) {
      console.error("Error fetching service providers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});
// create  - post router for service providers, get route for indivial/single providers, put route for service providers.

// CRUD OPERATIONS- CREATE, READ, UPDATE, DELETE
app.get("/users", (req, res) => {
  dbconn.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});
// users - email, phone,  first_name, last_name, password_hash, user_type ('client', 'provider', 'admin')
// http - encodes data in the body of the request, usually in JSON format
// for your server to understand the incoming data, you need to use middleware to parse(to decode) the JSON body

app.post("/users", (req, res) => {
  const { email, phone, first_name, last_name, password_hash, user_type } =
    req.body;

  const query =
    "INSERT INTO users (email, phone, first_name, last_name, password_hash, user_type) VALUES (?, ?, ?, ?, ?, ?)";

  dbconn.query(
    query,
    [email, phone, first_name, last_name, password_hash, user_type],
    (err, results) => {
      if (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        dbconn.query(
          "SELECT * FROM users WHERE id = ?",
          [results.insertId],
          (selectErr, users) => {
            if (selectErr) {
              console.error("Error loading created user:", selectErr);
              res.status(500).json({ error: "Internal Server Error" });
            } else {
              res.status(201).json(users[0]);
            }
          },
        );
      }
    },
  );
});

app.get("/users/:id", (req, res) => {
  dbconn.query(
    "SELECT * FROM users WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        res.status(500).json({ success: false, error: "Server Error" });
      } else {
        res.json(result[0] ?? null);
      }
    },
  );
});
app.put("/users/:id", (req, res) => {
  const { email, phone, first_name, last_name, user_type } = req.body;
  const updateStatement =
    "UPDATE users SET email = ?, phone = ?, first_name = ?, last_name = ?, user_type = ? WHERE id = ?";

  dbconn.query(
    updateStatement,
    [email, phone, first_name, last_name, user_type, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ success: false, error: err });
      } else {
        dbconn.query(
          "SELECT * FROM users WHERE id = ?",
          [req.params.id],
          (selectErr, users) => {
            if (selectErr) {
              res.status(500).json({ success: false, error: selectErr });
            } else {
              res.json({ success: true, user: users[0] ?? null });
            }
          },
        );
      }
    },
  );
});

app.delete("/users/:id", (req, res) => {});

app.get("/clients", (req, res) => {
  dbconn.query("SELECT * FROM clients", (err, results) => {
    if (err) {
      console.error("Error fetching clients:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results);
    }
  });
});

// app.get("/route/uri", callback)
// app.post("/route/uri", callback)
// app.post("/user", callback)

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
