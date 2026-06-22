const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

// Hosted behind an nginx reverse proxy. Trust the first proxy hop so that
// req.protocol / req.ip reflect the original client (via X-Forwarded-* headers)
// and "secure" session cookies are honored over the proxied HTTPS connection.
app.set("trust proxy", 1);

const dbconn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tendamema",
  database: "beautyplug",
  port: 3306,
});

// ---------------------------------------------------------------------------
// Middleware

// ---------------------------------------------------------------------------

// CORS must allow credentials so the session cookie is sent/received by browser
// clients. `origin: true` reflects the request origin (cannot use "*" with
// credentials).
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json()); // parse JSON bodies - postman, fetch, axios
app.use(express.urlencoded({ extended: true })); // parse form-encoded bodies

app.use(
  session({
    name: "beautyplug.sid",
    secret: "beautyplug-dev-secret-change-me", // move to env var in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // not readable by client-side JS
      secure: false, // set true when served over HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

// Number of bcrypt salt rounds for password hashing.
const SALT_ROUNDS = 10;

// Platform commission rate applied to every booking (15%).
const COMMISSION_RATE = 0.15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Strip the password_hash before sending a user object back to the client.
function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// Add `duration` minutes to a "HH:MM" / "HH:MM:SS" time string and return
// "HH:MM:SS". Used to derive a booking's end_time from the service duration.
function addMinutes(time, duration) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + Number(duration);
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

// ---------------------------------------------------------------------------
// Auth guards
// ---------------------------------------------------------------------------

// Reject the request unless a session user is present.
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Reject the request unless the session user is one of the allowed user_types.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.session.user.user_type)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

// ===========================================================================
// ROOT
// ===========================================================================

app.get("/", (req, res) => {
  res.json({ message: "BeautyPlug API", version: "1.0.0" });
});

// ===========================================================================
// AUTHENTICATION  (express-session + bcrypt)
// ===========================================================================

// Register a new user. Also creates the matching profile row (clients or
// service_providers) based on user_type, then logs the user in.
app.post("/auth/register", (req, res) => {
  const {
    email,
    phone,
    first_name,
    last_name,
    password,
    user_type,
    business_name, // required when user_type === 'provider'
    primary_category, // required when user_type === 'provider'
  } = req.body;

  if (
    !email ||
    !phone ||
    !first_name ||
    !last_name ||
    !password ||
    !user_type
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!["client", "provider", "admin"].includes(user_type)) {
    return res.status(400).json({ error: "Invalid user_type" });
  }
  if (user_type === "provider" && (!business_name || !primary_category)) {
    return res.status(400).json({
      error: "business_name and primary_category are required for providers",
    });
  }

  bcrypt.hash(password, SALT_ROUNDS, (hashErr, password_hash) => {
    if (hashErr) {
      console.error("Error hashing password:", hashErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const insertUser =
      "INSERT INTO users (email, phone, first_name, last_name, password_hash, user_type) VALUES (?, ?, ?, ?, ?, ?)";

    dbconn.query(
      insertUser,
      [email, phone, first_name, last_name, password_hash, user_type],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .json({ error: "Email or phone already registered" });
          }
          console.error("Error creating user:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const userId = result.insertId;

        // Create the role-specific profile row.
        const finishRegistration = () => {
          dbconn.query(
            "SELECT * FROM users WHERE id = ?",
            [userId],
            (selErr, users) => {
              if (selErr) {
                console.error("Error loading created user:", selErr);
                return res.status(500).json({ error: "Internal Server Error" });
              }
              const user = publicUser(users[0]);
              req.session.user = user; // log the user in
              res.status(201).json({ user });
            },
          );
        };

        if (user_type === "client") {
          dbconn.query(
            "INSERT INTO clients (user_id) VALUES (?)",
            [userId],
            (cErr) => {
              if (cErr) {
                console.error("Error creating client profile:", cErr);
                return res.status(500).json({ error: "Internal Server Error" });
              }
              finishRegistration();
            },
          );
        } else if (user_type === "provider") {
          dbconn.query(
            "INSERT INTO service_providers (user_id, business_name, primary_category) VALUES (?, ?, ?)",
            [userId, business_name, primary_category],
            (pErr) => {
              if (pErr) {
                console.error("Error creating provider profile:", pErr);
                return res.status(500).json({ error: "Internal Server Error" });
              }
              finishRegistration();
            },
          );
        } else {
          // admin: no extra profile row
          finishRegistration();
        }
      },
    );
  });
});

// Log in with email + password. Verifies the bcrypt hash and starts a session.
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  dbconn.query("SELECT * FROM users WHERE email = ?", [email], (err, users) => {
    if (err) {
      console.error("Error during login:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    bcrypt.compare(password, user.password_hash, (cmpErr, match) => {
      if (cmpErr) {
        console.error("Error comparing password:", cmpErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.user = publicUser(user);
      res.json({ user: req.session.user });
    });
  });
});

// Destroy the current session.
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.clearCookie("beautyplug.sid");
    res.json({ message: "Logged out" });
  });
});

// Return the currently authenticated user.
app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// ===========================================================================
// USERS
// ===========================================================================

// List all users (admin only). Passwords are never returned.
app.get("/users", (req, res) => {
  dbconn.query(
    "SELECT id, email, phone, first_name, last_name, user_type, created_at, updated_at FROM users",
    (err, results) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
    },
  );
});

// Get a single user by id (must be authenticated).
app.get("/users/:id", requireAuth, (req, res) => {
  dbconn.query(
    "SELECT id, email, phone, first_name, last_name, user_type, created_at, updated_at FROM users WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!result[0]) return res.status(404).json({ error: "User not found" });
      res.json(result[0]);
    },
  );
});

// Update a user's own profile fields (or any user if admin).
app.put("/users/:id", requireAuth, (req, res) => {
  const sessionUser = req.session.user;
  if (sessionUser.user_type !== "admin" && sessionUser.id != req.params.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { email, phone, first_name, last_name } = req.body;
  const updateStatement =
    "UPDATE users SET email = ?, phone = ?, first_name = ?, last_name = ? WHERE id = ?";

  dbconn.query(
    updateStatement,
    [email, phone, first_name, last_name, req.params.id],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Email or phone in use" });
        }
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      dbconn.query(
        "SELECT id, email, phone, first_name, last_name, user_type, created_at, updated_at FROM users WHERE id = ?",
        [req.params.id],
        (selErr, users) => {
          if (selErr) {
            console.error("Error loading updated user:", selErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.json(users[0] ?? null);
        },
      );
    },
  );
});

// Delete a user (admin only). Cascades to profile/bookings via FK rules.
app.delete("/users/:id", requireRole("admin"), (req, res) => {
  dbconn.query(
    "DELETE FROM users WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted" });
    },
  );
});

// ===========================================================================
// SERVICE PROVIDERS
// ===========================================================================

// List providers. Optional filters: ?category=barber&approval_status=approved
// Excludes soft-deleted providers.
app.get("/service-providers", (req, res) => {
  const { category, approval_status } = req.query;
  let sql = "SELECT * FROM service_providers WHERE is_deleted = FALSE";
  const params = [];
  if (category) {
    sql += " AND primary_category = ?";
    params.push(category);
  }
  if (approval_status) {
    sql += " AND approval_status = ?";
    params.push(approval_status);
  }
  dbconn.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching service providers:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Get a single provider with its joined user details.
app.get("/service-providers/:id", (req, res) => {
  dbconn.query(
    `SELECT sp.*, u.first_name, u.last_name, u.email, u.phone
     FROM service_providers sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.id = ? AND sp.is_deleted = FALSE`,
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error fetching provider:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!result[0])
        return res.status(404).json({ error: "Provider not found" });
      res.json(result[0]);
    },
  );
});

// Create a provider profile for the logged-in provider user.
app.post("/service-providers", requireRole("provider", "admin"), (req, res) => {
  const {
    business_name,
    bio,
    profile_picture_url,
    primary_category,
    home_location_address,
    home_location_latitude,
    home_location_longitude,
  } = req.body;

  if (!business_name || !primary_category) {
    return res
      .status(400)
      .json({ error: "business_name and primary_category are required" });
  }

  dbconn.query(
    `INSERT INTO service_providers
       (user_id, business_name, bio, profile_picture_url, primary_category,
        home_location_address, home_location_latitude, home_location_longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.session.user.id,
      business_name,
      bio ?? null,
      profile_picture_url ?? null,
      primary_category,
      home_location_address ?? null,
      home_location_latitude ?? null,
      home_location_longitude ?? null,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Provider profile already exists for this user" });
        }
        console.error("Error creating provider:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      dbconn.query(
        "SELECT * FROM service_providers WHERE id = ?",
        [result.insertId],
        (selErr, rows) => {
          if (selErr) {
            console.error("Error loading provider:", selErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.status(201).json(rows[0]);
        },
      );
    },
  );
});

// Update provider profile fields. Owner or admin only.
app.put("/service-providers/:id", requireAuth, (req, res) => {
  dbconn.query(
    "SELECT * FROM service_providers WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) {
        console.error("Error loading provider:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (!rows[0])
        return res.status(404).json({ error: "Provider not found" });

      const provider = rows[0];
      const u = req.session.user;
      if (u.user_type !== "admin" && provider.user_id !== u.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const {
        business_name = provider.business_name,
        bio = provider.bio,
        profile_picture_url = provider.profile_picture_url,
        primary_category = provider.primary_category,
        home_location_address = provider.home_location_address,
        home_location_latitude = provider.home_location_latitude,
        home_location_longitude = provider.home_location_longitude,
      } = req.body;

      dbconn.query(
        `UPDATE service_providers SET
           business_name = ?, bio = ?, profile_picture_url = ?,
           primary_category = ?, home_location_address = ?,
           home_location_latitude = ?, home_location_longitude = ?
         WHERE id = ?`,
        [
          business_name,
          bio,
          profile_picture_url,
          primary_category,
          home_location_address,
          home_location_latitude,
          home_location_longitude,
          req.params.id,
        ],
        (updErr) => {
          if (updErr) {
            console.error("Error updating provider:", updErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          dbconn.query(
            "SELECT * FROM service_providers WHERE id = ?",
            [req.params.id],
            (selErr, updated) => {
              if (selErr) {
                return res.status(500).json({ error: "Internal Server Error" });
              }
              res.json(updated[0]);
            },
          );
        },
      );
    },
  );
});

// Update a provider's approval status (admin only).
app.put("/service-providers/:id/approval", requireRole("admin"), (req, res) => {
  const { approval_status, approval_notes, rejection_reason } = req.body;
  const valid = [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "suspended",
  ];
  if (!valid.includes(approval_status)) {
    return res.status(400).json({ error: "Invalid approval_status" });
  }

  dbconn.query(
    `UPDATE service_providers SET
         approval_status = ?,
         approval_notes = ?,
         approved_by = ?,
         approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE approved_at END,
         rejected_at = CASE WHEN ? = 'rejected' THEN NOW() ELSE rejected_at END,
         rejection_reason = ?
       WHERE id = ?`,
    [
      approval_status,
      approval_notes ?? null,
      req.session.user.id,
      approval_status,
      approval_status,
      rejection_reason ?? null,
      req.params.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating approval:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json({ message: "Approval status updated", approval_status });
    },
  );
});

// Soft-delete a provider. Owner or admin only.
app.delete("/service-providers/:id", requireAuth, (req, res) => {
  dbconn.query(
    "SELECT user_id FROM service_providers WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!rows[0])
        return res.status(404).json({ error: "Provider not found" });

      const u = req.session.user;
      if (u.user_type !== "admin" && rows[0].user_id !== u.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      dbconn.query(
        "UPDATE service_providers SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?",
        [req.params.id],
        (delErr) => {
          if (delErr) {
            console.error("Error deleting provider:", delErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.json({ message: "Provider deleted" });
        },
      );
    },
  );
});

// ===========================================================================
// SERVICES
// ===========================================================================

// List services. Optional filters: ?provider_id=1&is_active=1
app.get("/services", (req, res) => {
  const { provider_id, is_active } = req.query;
  let sql = "SELECT * FROM services WHERE 1 = 1";
  const params = [];
  if (provider_id) {
    sql += " AND provider_id = ?";
    params.push(provider_id);
  }
  if (is_active !== undefined) {
    sql += " AND is_active = ?";
    params.push(is_active === "true" || is_active === "1" ? 1 : 0);
  }
  dbconn.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching services:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Get a single service.
app.get("/services/:id", (req, res) => {
  dbconn.query(
    "SELECT * FROM services WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!result[0])
        return res.status(404).json({ error: "Service not found" });
      res.json(result[0]);
    },
  );
});

// Create a service (provider/admin only).
app.post("/services", requireRole("provider", "admin"), (req, res) => {
  const {
    provider_id,
    service_name,
    service_description,
    price,
    duration_minutes,
  } = req.body;

  if (
    !provider_id ||
    !service_name ||
    price == null ||
    duration_minutes == null
  ) {
    return res.status(400).json({
      error:
        "provider_id, service_name, price and duration_minutes are required",
    });
  }

  dbconn.query(
    `INSERT INTO services
       (provider_id, service_name, service_description, price, duration_minutes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      provider_id,
      service_name,
      service_description ?? null,
      price,
      duration_minutes,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating service:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      dbconn.query(
        "SELECT * FROM services WHERE id = ?",
        [result.insertId],
        (selErr, rows) => {
          if (selErr) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.status(201).json(rows[0]);
        },
      );
    },
  );
});

// Update a service (provider/admin only).
app.put("/services/:id", requireRole("provider", "admin"), (req, res) => {
  dbconn.query(
    "SELECT * FROM services WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!rows[0]) return res.status(404).json({ error: "Service not found" });

      const s = rows[0];
      const {
        service_name = s.service_name,
        service_description = s.service_description,
        price = s.price,
        duration_minutes = s.duration_minutes,
        is_active = s.is_active,
      } = req.body;

      dbconn.query(
        `UPDATE services SET
           service_name = ?, service_description = ?, price = ?,
           duration_minutes = ?, is_active = ?
         WHERE id = ?`,
        [
          service_name,
          service_description,
          price,
          duration_minutes,
          is_active ? 1 : 0,
          req.params.id,
        ],
        (updErr) => {
          if (updErr) {
            console.error("Error updating service:", updErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          dbconn.query(
            "SELECT * FROM services WHERE id = ?",
            [req.params.id],
            (selErr, updated) => {
              if (selErr) {
                return res.status(500).json({ error: "Internal Server Error" });
              }
              res.json(updated[0]);
            },
          );
        },
      );
    },
  );
});

// Delete a service (provider/admin only).
app.delete("/services/:id", requireRole("provider", "admin"), (req, res) => {
  dbconn.query(
    "DELETE FROM services WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        // FK RESTRICT: a service referenced by a booking cannot be deleted.
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
          return res.status(409).json({
            error: "Service has bookings; deactivate it instead",
          });
        }
        console.error("Error deleting service:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ message: "Service deleted" });
    },
  );
});

// ===========================================================================
// CLIENTS
// ===========================================================================

// List all client profiles (admin only).
app.get("/clients", requireRole("admin"), (req, res) => {
  dbconn.query("SELECT * FROM clients", (err, results) => {
    if (err) {
      console.error("Error fetching clients:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Get a single client profile with joined user details.
app.get("/clients/:id", requireAuth, (req, res) => {
  dbconn.query(
    `SELECT c.*, u.first_name, u.last_name, u.email, u.phone
     FROM clients c JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!result[0])
        return res.status(404).json({ error: "Client not found" });
      res.json(result[0]);
    },
  );
});

// Update the logged-in client's profile (bio / picture). Owner or admin.
app.put("/clients/:id", requireAuth, (req, res) => {
  dbconn.query(
    "SELECT * FROM clients WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!rows[0]) return res.status(404).json({ error: "Client not found" });

      const u = req.session.user;
      if (u.user_type !== "admin" && rows[0].user_id !== u.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const {
        bio = rows[0].bio,
        profile_picture_url = rows[0].profile_picture_url,
      } = req.body;

      dbconn.query(
        "UPDATE clients SET bio = ?, profile_picture_url = ? WHERE id = ?",
        [bio, profile_picture_url, req.params.id],
        (updErr) => {
          if (updErr) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          dbconn.query(
            "SELECT * FROM clients WHERE id = ?",
            [req.params.id],
            (selErr, updated) => {
              if (selErr) {
                return res.status(500).json({ error: "Internal Server Error" });
              }
              res.json(updated[0]);
            },
          );
        },
      );
    },
  );
});

// ===========================================================================
// BOOKINGS
// ===========================================================================

// List bookings. Optional filters: ?client_id=&provider_id=&status=
app.get("/bookings", requireAuth, (req, res) => {
  const { client_id, provider_id, status } = req.query;
  let sql = "SELECT * FROM bookings WHERE 1 = 1";
  const params = [];
  if (client_id) {
    sql += " AND client_id = ?";
    params.push(client_id);
  }
  if (provider_id) {
    sql += " AND provider_id = ?";
    params.push(provider_id);
  }
  if (status) {
    sql += " AND booking_status = ?";
    params.push(status);
  }
  sql += " ORDER BY service_date DESC, start_time DESC";
  dbconn.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching bookings:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Get a single booking.
app.get("/bookings/:id", requireAuth, (req, res) => {
  dbconn.query(
    "SELECT * FROM bookings WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!result[0])
        return res.status(404).json({ error: "Booking not found" });
      res.json(result[0]);
    },
  );
});

// Create a booking. Price, end_time and commission split are derived
// server-side from the chosen service so the client cannot tamper with them.
app.post("/bookings", requireRole("client", "admin"), (req, res) => {
  const {
    client_id,
    service_id,
    service_date,
    start_time,
    service_location_address,
    service_location_latitude,
    service_location_longitude,
    is_at_provider_location,
    client_notes,
  } = req.body;

  if (
    !client_id ||
    !service_id ||
    !service_date ||
    !start_time ||
    !service_location_address
  ) {
    return res.status(400).json({
      error:
        "client_id, service_id, service_date, start_time and service_location_address are required",
    });
  }

  // Look up the service to derive provider_id, price and duration.
  dbconn.query(
    "SELECT * FROM services WHERE id = ?",
    [service_id],
    (err, services) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!services[0])
        return res.status(404).json({ error: "Service not found" });

      const service = services[0];
      const price = Number(service.price);
      const commission = +(price * COMMISSION_RATE).toFixed(2);
      const earnings = +(price - commission).toFixed(2);
      const end_time = addMinutes(start_time, service.duration_minutes);

      dbconn.query(
        `INSERT INTO bookings
           (client_id, service_id, provider_id, service_date, start_time, end_time,
            service_location_address, service_location_latitude, service_location_longitude,
            is_at_provider_location, service_price, platform_commission,
            provider_earnings, client_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client_id,
          service_id,
          service.provider_id,
          service_date,
          start_time,
          end_time,
          service_location_address,
          service_location_latitude ?? null,
          service_location_longitude ?? null,
          is_at_provider_location ? 1 : 0,
          price,
          commission,
          earnings,
          client_notes ?? null,
        ],
        (insErr, result) => {
          if (insErr) {
            console.error("Error creating booking:", insErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
          dbconn.query(
            "SELECT * FROM bookings WHERE id = ?",
            [result.insertId],
            (selErr, rows) => {
              if (selErr) {
                return res.status(500).json({ error: "Internal Server Error" });
              }
              res.status(201).json(rows[0]);
            },
          );
        },
      );
    },
  );
});

// Update a booking's status (confirm / complete / no_show, etc).
app.put("/bookings/:id/status", requireAuth, (req, res) => {
  const { booking_status, provider_notes } = req.body;
  const valid = ["requested", "confirmed", "completed", "cancelled", "no_show"];
  if (!valid.includes(booking_status)) {
    return res.status(400).json({ error: "Invalid booking_status" });
  }

  dbconn.query(
    "UPDATE bookings SET booking_status = ?, provider_notes = COALESCE(?, provider_notes) WHERE id = ?",
    [booking_status, provider_notes ?? null, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error updating booking:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ message: "Booking status updated", booking_status });
    },
  );
});

// Cancel a booking (soft state change, records who cancelled and why).
app.delete("/bookings/:id", requireAuth, (req, res) => {
  const { cancellation_reason } = req.body;
  const cancelledBy = req.session.user.user_type; // 'client' | 'provider' | 'admin'

  dbconn.query(
    `UPDATE bookings SET
       booking_status = 'cancelled',
       cancelled_by = ?,
       cancellation_reason = ?,
       cancelled_at = NOW()
     WHERE id = ?`,
    [cancelledBy, cancellation_reason ?? null, req.params.id],
    (err, result) => {
      if (err) {
        console.error("Error cancelling booking:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ message: "Booking cancelled" });
    },
  );
});

// ===========================================================================
// RATINGS & REVIEWS
// ===========================================================================

// List ratings. Optional filters: ?provider_id=&client_id=
app.get("/ratings", (req, res) => {
  const { provider_id, client_id } = req.query;
  let sql = "SELECT * FROM ratings WHERE 1 = 1";
  const params = [];
  if (provider_id) {
    sql += " AND provider_id = ?";
    params.push(provider_id);
  }
  if (client_id) {
    sql += " AND client_id = ?";
    params.push(client_id);
  }
  sql += " ORDER BY created_at DESC";
  dbconn.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching ratings:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Create a rating for a completed booking (client/admin only).
app.post("/ratings", requireRole("client", "admin"), (req, res) => {
  const {
    booking_id,
    client_id,
    provider_id,
    rating_stars,
    review_text,
    cleanliness_rating,
    professionalism_rating,
    punctuality_rating,
    quality_rating,
    photo_url,
  } = req.body;

  if (!booking_id || !client_id || !provider_id || !rating_stars) {
    return res.status(400).json({
      error: "booking_id, client_id, provider_id and rating_stars are required",
    });
  }
  if (rating_stars < 1 || rating_stars > 5) {
    return res.status(400).json({ error: "rating_stars must be 1-5" });
  }

  dbconn.query(
    `INSERT INTO ratings
       (booking_id, client_id, provider_id, rating_stars, review_text,
        cleanliness_rating, professionalism_rating, punctuality_rating,
        quality_rating, photo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking_id,
      client_id,
      provider_id,
      rating_stars,
      review_text ?? null,
      cleanliness_rating ?? null,
      professionalism_rating ?? null,
      punctuality_rating ?? null,
      quality_rating ?? null,
      photo_url ?? null,
    ],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "This booking has already been rated" });
        }
        console.error("Error creating rating:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      dbconn.query(
        "SELECT * FROM ratings WHERE id = ?",
        [result.insertId],
        (selErr, rows) => {
          if (selErr) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.status(201).json(rows[0]);
        },
      );
    },
  );
});

// Provider responds to a rating (provider/admin only).
app.put(
  "/ratings/:id/response",
  requireRole("provider", "admin"),
  (req, res) => {
    const { provider_response } = req.body;
    if (!provider_response) {
      return res.status(400).json({ error: "provider_response is required" });
    }
    dbconn.query(
      "UPDATE ratings SET provider_response = ?, provider_responded_at = NOW() WHERE id = ?",
      [provider_response, req.params.id],
      (err, result) => {
        if (err) {
          console.error("Error responding to rating:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Rating not found" });
        }
        res.json({ message: "Response saved" });
      },
    );
  },
);

// ===========================================================================
// PROVIDER AVAILABILITY SLOTS
// ===========================================================================

// List a provider's availability. ?provider_id= required; ?only_available=1 opt.
app.get("/availability", (req, res) => {
  const { provider_id, only_available } = req.query;
  if (!provider_id) {
    return res
      .status(400)
      .json({ error: "provider_id query param is required" });
  }
  let sql = "SELECT * FROM provider_availability_slots WHERE provider_id = ?";
  const params = [provider_id];
  if (only_available === "1" || only_available === "true") {
    sql += " AND is_available = TRUE";
  }
  sql += " ORDER BY available_date, start_time";
  dbconn.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching availability:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

// Add an availability slot (provider/admin only).
app.post("/availability", requireRole("provider", "admin"), (req, res) => {
  const { provider_id, available_date, start_time, end_time } = req.body;
  if (!provider_id || !available_date || !start_time || !end_time) {
    return res.status(400).json({
      error:
        "provider_id, available_date, start_time and end_time are required",
    });
  }
  dbconn.query(
    `INSERT INTO provider_availability_slots
       (provider_id, available_date, start_time, end_time)
     VALUES (?, ?, ?, ?)`,
    [provider_id, available_date, start_time, end_time],
    (err, result) => {
      if (err) {
        console.error("Error creating slot:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      dbconn.query(
        "SELECT * FROM provider_availability_slots WHERE id = ?",
        [result.insertId],
        (selErr, rows) => {
          if (selErr) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          res.status(201).json(rows[0]);
        },
      );
    },
  );
});

// Toggle / update a slot (provider/admin only).
app.put("/availability/:id", requireRole("provider", "admin"), (req, res) => {
  const { available_date, start_time, end_time, is_available } = req.body;
  dbconn.query(
    "SELECT * FROM provider_availability_slots WHERE id = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (!rows[0]) return res.status(404).json({ error: "Slot not found" });

      const s = rows[0];
      dbconn.query(
        `UPDATE provider_availability_slots SET
           available_date = ?, start_time = ?, end_time = ?, is_available = ?
         WHERE id = ?`,
        [
          available_date ?? s.available_date,
          start_time ?? s.start_time,
          end_time ?? s.end_time,
          is_available === undefined ? s.is_available : is_available ? 1 : 0,
          req.params.id,
        ],
        (updErr) => {
          if (updErr) {
            return res.status(500).json({ error: "Internal Server Error" });
          }
          dbconn.query(
            "SELECT * FROM provider_availability_slots WHERE id = ?",
            [req.params.id],
            (selErr, updated) => {
              if (selErr) {
                return res.status(500).json({ error: "Internal Server Error" });
              }
              res.json(updated[0]);
            },
          );
        },
      );
    },
  );
});

// Delete a slot (provider/admin only).
app.delete(
  "/availability/:id",
  requireRole("provider", "admin"),
  (req, res) => {
    dbconn.query(
      "DELETE FROM provider_availability_slots WHERE id = ?",
      [req.params.id],
      (err, result) => {
        if (err)
          return res.status(500).json({ error: "Internal Server Error" });
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Slot not found" });
        }
        res.json({ message: "Slot deleted" });
      },
    );
  },
);

// ===========================================================================
// CLIENT FAVORITES / WISHLIST
// ===========================================================================

// List a client's favorite providers. ?client_id= required.
app.get("/favorites", requireAuth, (req, res) => {
  const { client_id } = req.query;
  if (!client_id) {
    return res.status(400).json({ error: "client_id query param is required" });
  }
  dbconn.query(
    `SELECT f.*, sp.business_name, sp.primary_category
     FROM client_favorites f
     JOIN service_providers sp ON f.provider_id = sp.id
     WHERE f.client_id = ?`,
    [client_id],
    (err, results) => {
      if (err) {
        console.error("Error fetching favorites:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
    },
  );
});

// Add a provider to a client's favorites (client/admin only).
app.post("/favorites", requireRole("client", "admin"), (req, res) => {
  const { client_id, provider_id } = req.body;
  if (!client_id || !provider_id) {
    return res
      .status(400)
      .json({ error: "client_id and provider_id are required" });
  }
  dbconn.query(
    "INSERT INTO client_favorites (client_id, provider_id) VALUES (?, ?)",
    [client_id, provider_id],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Already in favorites" });
        }
        console.error("Error adding favorite:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.status(201).json({ id: result.insertId, client_id, provider_id });
    },
  );
});

// Remove a favorite by its id (client/admin only).
app.delete("/favorites/:id", requireRole("client", "admin"), (req, res) => {
  dbconn.query(
    "DELETE FROM client_favorites WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Favorite not found" });
      }
      res.json({ message: "Removed from favorites" });
    },
  );
});

// ===========================================================================
// 404 fallback
// ===========================================================================

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
