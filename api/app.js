const express = require("express");
const mysql = require("mysql2");

const app = express();
const dbconn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tendamema",
  database: "beautyplug",
  port: 3306,
});
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
  // input validation can be added here -- avoid attacks like SQL injection, XSS, etc.
  const query = `INSERT INTO users (email, phone, first_name, last_name, password_hash, user_type) VALUES ( '${email}' , '${phone}' , '${first_name}' , '${last_name}' , '${password_hash}' , '${user_type}' )`;

  dbconn.query(query, (err, results) => {
    if (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(201).json({
        message: "User created successfully",
        userId: results.insertId,
      });
    }
  });
});

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
