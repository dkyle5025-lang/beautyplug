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
