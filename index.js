const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");

const app = express();
app.use(bodyParser.json());
const db = new sqlite3.Database(":memory:");


db.serialize(() => {
  db.run(`CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone_number TEXT,
        email TEXT,
        diagnostic_level INTEGER,
        current_level INTEGER,
        first_message_timestamp TEXT,
        last_message_timestamp TEXT,
        message_ids TEXT
    )`);
});


app.post(
  "/users",
  [
    body("id").notEmpty(),
    body("phone_number").notEmpty(),
    body("email").optional().isEmail(),
    body("diagnostic_level").isInt({ min: 0, max: 10 }),
    body("current_level").isInt({ min: 0, max: 10 }),
    body("first_message_timestamp").isISO8601(),
    body("last_message_timestamp").isISO8601(),
    body("message_ids")
      .isArray()
      .custom((value) => {
        return value.every((id, index) => typeof id === 'string');
      }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      id,
      name,
      phone_number,
      email,
      diagnostic_level,
      current_level,
      first_message_timestamp,
      last_message_timestamp,
      message_ids,
    } = req.body;
    const messageIdsStr = JSON.stringify(message_ids);

    const stmt = db.prepare(
      `INSERT INTO users (id, name, phone_number, email, diagnostic_level, current_level, first_message_timestamp, last_message_timestamp, message_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      id,
      name,
      phone_number,
      email,
      diagnostic_level,
      current_level,
      first_message_timestamp,
      last_message_timestamp,
      messageIdsStr,
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "User created", status: 201 });
      }
    );
    stmt.finalize();
  }
);


app.get("/users/:id", (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    row.message_ids = JSON.parse(row.message_ids);
    res.json({
        data: row,
        status: 200
    });
  });
});

app.get("/", (req, res) => {
  res.json({
    status: 200,
    message: "welocme rising staars",
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
