# BeautyPlug API

REST API for the BeautyPlug beauty-service marketplace. Built with **Express 5**,
**mysql2**, **express-session** (cookie-based auth) and **bcrypt** (password
hashing). All request and response bodies are JSON.

---

## Table of contents

- [Stack & architecture](#stack--architecture)
- [Setup](#setup)
- [Authentication model](#authentication-model)
- [Conventions](#conventions)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Users](#users)
  - [Service providers](#service-providers)
  - [Services](#services)
  - [Clients](#clients)
  - [Bookings](#bookings)
  - [Ratings & reviews](#ratings--reviews)
  - [Availability slots](#availability-slots)
  - [Favorites](#favorites)
- [Error reference](#error-reference)

---

## Stack & architecture

| Layer       | Choice                                                     |
| ----------- | ---------------------------------------------------------- |
| Runtime     | Node.js (CommonJS)                                         |
| Framework   | Express 5                                                  |
| Database    | MySQL (`mysql2` driver, single connection, callback style) |
| Sessions    | `express-session` (in-memory store, cookie `beautyplug.sid`) |
| Passwords   | `bcrypt`, 10 salt rounds                                   |
| Entry point | `app.js` (single-file API), listens on **port 3000**       |

The entire API lives in [`app.js`](app.js). The database schema is defined in
[`../database design/beautyplug_database_schema.sql`](../database%20design/beautyplug_database_schema.sql).

---

## Setup

### 1. Database

Create the schema (drops and recreates the `beautyplug` database, seeds sample
data):

```bash
mysql -u root -p < "../database design/beautyplug_database_schema.sql"
```

### 2. Connection config

DB credentials are hard-coded near the top of `app.js`. Adjust to match your
local MySQL instance:

```js
const dbconn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "tendamema",
  database: "beautyplug",
  port: 3306,
});
```

### 3. Install & run

```bash
cd api
npm install
npm run dev      # node --watch app.js (auto-restart on change)
# or
node app.js
```

Server starts at `http://localhost:3000`.

> **Production note:** the session `secret` is hard-coded for development. Move
> it to an environment variable and set `cookie.secure = true` behind HTTPS.

---

## Authentication model

Auth is **session + cookie** based, not token based.

1. `POST /auth/register` or `POST /auth/login` validates credentials and stores
   the sanitized user object (no `password_hash`) in `req.session.user`.
2. The server responds with the `Set-Cookie: beautyplug.sid=...` header.
3. Clients must send that cookie on every subsequent request.

**Browser / fetch:** include `credentials: "include"`.
**Postman:** cookies are stored automatically once you log in.
**cURL:** use a cookie jar (`-c cookies.txt` to save, `-b cookies.txt` to send).

CORS is configured with `origin: true` + `credentials: true` so the cookie works
from a browser front-end on another origin.

### Roles

The `user_type` enum drives authorization via two guards in `app.js`:

- `requireAuth` — any logged-in user.
- `requireRole(...types)` — user must be one of `client`, `provider`, `admin`.

| Role       | Capabilities                                                            |
| ---------- | ----------------------------------------------------------------------- |
| `client`   | Book services, rate, manage favorites, edit own profile.                |
| `provider` | Manage own provider profile, services, availability, respond to reviews. |
| `admin`    | Everything, plus user management and provider approval.                 |

---

## Conventions

- **Base URL:** `http://localhost:3000`
- **Content-Type:** `application/json` for all bodies.
- **IDs:** integer, auto-increment.
- **Timestamps:** MySQL `TIMESTAMP`, returned as ISO-ish strings.
- **Money:** `DECIMAL(10,2)` returned as strings (mysql2 default).
- **Passwords** are never returned in any response.
- **Filtering:** list endpoints accept optional query-string filters (documented per endpoint).

### Common status codes

| Code | Meaning                                            |
| ---- | -------------------------------------------------- |
| 200  | OK                                                 |
| 201  | Created                                            |
| 400  | Bad request / missing required fields              |
| 401  | Not authenticated (no/invalid session)             |
| 403  | Authenticated but role/ownership not permitted     |
| 404  | Resource not found                                 |
| 409  | Conflict (duplicate unique value, FK restriction)  |
| 500  | Internal server error                              |

---

## Endpoints

### Auth

#### `POST /auth/register`

Creates a `users` row and the matching profile row (`clients` for `client`,
`service_providers` for `provider`; `admin` gets no profile row). Logs the user
in on success.

**Auth:** none.

**Body:**

| Field              | Type   | Required               | Notes                                       |
| ------------------ | ------ | ---------------------- | ------------------------------------------- |
| `email`            | string | yes                    | Unique.                                     |
| `phone`            | string | yes                    | Unique.                                     |
| `first_name`       | string | yes                    |                                             |
| `last_name`        | string | yes                    |                                             |
| `password`         | string | yes                    | Plaintext; hashed server-side with bcrypt.  |
| `user_type`        | enum   | yes                    | `client` \| `provider` \| `admin`.          |
| `business_name`    | string | providers only         | Required when `user_type = provider`.       |
| `primary_category` | enum   | providers only         | e.g. `barber`, `hairstylist`, `makeup`…     |

**Request:**

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "phone": "+254700000000",
    "first_name": "Jane",
    "last_name": "Doe",
    "password": "secret123",
    "user_type": "client"
  }'
```

**`201 Created`:**

```json
{
  "user": {
    "id": 5,
    "email": "jane@example.com",
    "phone": "+254700000000",
    "first_name": "Jane",
    "last_name": "Doe",
    "user_type": "client",
    "created_at": "2026-06-17T10:00:00.000Z",
    "updated_at": "2026-06-17T10:00:00.000Z"
  }
}
```

**Errors:** `400` missing fields / invalid `user_type`; `409` email or phone already registered.

---

#### `POST /auth/login`

**Auth:** none.

**Body:** `{ "email": string, "password": string }`

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "password": "secret123" }'
```

**`200 OK`:** `{ "user": { ...sanitized user... } }`

**Errors:** `400` missing fields; `401` invalid credentials.

---

#### `POST /auth/logout`

Destroys the session and clears the cookie. **Auth:** session cookie.

**`200 OK`:** `{ "message": "Logged out" }`

---

#### `GET /auth/me`

Returns the currently authenticated user. **Auth:** `requireAuth`.

**`200 OK`:** `{ "user": { ...sanitized user... } }` — `401` if not logged in.

---

### Users

#### `GET /users`

List all users. **Auth:** `admin`.

```json
[
  {
    "id": 1,
    "email": "admin@beautyplug.com",
    "phone": "+1234567890",
    "first_name": "Admin",
    "last_name": "User",
    "user_type": "admin",
    "created_at": "2026-06-17T09:00:00.000Z",
    "updated_at": "2026-06-17T09:00:00.000Z"
  }
]
```

#### `GET /users/:id`

Single user. **Auth:** `requireAuth`. `404` if not found.

#### `PUT /users/:id`

Update `email`, `phone`, `first_name`, `last_name`. **Auth:** owner or `admin`
(non-admins can only edit their own record → `403` otherwise).

**Body:** `{ "email", "phone", "first_name", "last_name" }`

**`200 OK`:** updated user. **Errors:** `403`, `409` duplicate email/phone.

#### `DELETE /users/:id`

Delete a user (cascades to profile and dependent rows per schema FKs).
**Auth:** `admin`.

**`200 OK`:** `{ "message": "User deleted" }` — `404` if not found.

---

### Service providers

#### `GET /service-providers`

List providers, excluding soft-deleted ones. **Auth:** none (public catalog).

**Query filters:** `category` (primary_category), `approval_status`.

```bash
curl "http://localhost:3000/service-providers?category=barber&approval_status=approved"
```

```json
[
  {
    "id": 1,
    "user_id": 4,
    "business_name": "Johns Barbershop",
    "bio": "Professional barber with 10 years of experience",
    "primary_category": "barber",
    "approval_status": "approved",
    "is_deleted": 0,
    "profile_completion_percentage": 100,
    "created_at": "2026-06-17T09:00:00.000Z"
  }
]
```

#### `GET /service-providers/:id`

Single provider joined with its user details (`first_name`, `last_name`,
`email`, `phone`). **Auth:** none. `404` if not found / deleted.

#### `POST /service-providers`

Create a provider profile for the logged-in provider user. **Auth:** `provider`
or `admin`.

**Body:**

| Field                     | Required | Notes                  |
| ------------------------- | -------- | ---------------------- |
| `business_name`           | yes      |                        |
| `primary_category`        | yes      | category enum          |
| `bio`                     | no       |                        |
| `profile_picture_url`     | no       |                        |
| `home_location_address`   | no       |                        |
| `home_location_latitude`  | no       | DECIMAL(10,8)          |
| `home_location_longitude` | no       | DECIMAL(11,8)          |

**`201 Created`:** the created provider row. **Errors:** `400`, `409` profile
already exists for the user.

#### `PUT /service-providers/:id`

Update profile fields (partial updates supported; omitted fields keep their
current value). **Auth:** owner or `admin`. `403` otherwise, `404` if missing.

#### `PUT /service-providers/:id/approval`

Admin vetting action. Sets `approval_status` and stamps `approved_by`/
`approved_at` or `rejected_at` accordingly. **Auth:** `admin`.

**Body:**

```json
{
  "approval_status": "approved",
  "approval_notes": "Documents verified",
  "rejection_reason": null
}
```

`approval_status` ∈ `pending | under_review | approved | rejected | suspended`.

**`200 OK`:** `{ "message": "Approval status updated", "approval_status": "approved" }`

#### `DELETE /service-providers/:id`

Soft delete (`is_deleted = TRUE`, `deleted_at = NOW()`). **Auth:** owner or
`admin`.

**`200 OK`:** `{ "message": "Provider deleted" }`

---

### Services

#### `GET /services`

List services. **Auth:** none.

**Query filters:** `provider_id`, `is_active` (`true`/`1`).

```json
[
  {
    "id": 1,
    "provider_id": 1,
    "service_name": "Basic Haircut",
    "service_description": "Professional haircut",
    "price": "25.00",
    "duration_minutes": 30,
    "is_active": 1
  }
]
```

#### `GET /services/:id`

Single service. **Auth:** none. `404` if not found.

#### `POST /services`

**Auth:** `provider` or `admin`.

**Body:** `provider_id`*, `service_name`*, `price`*, `duration_minutes`*,
`service_description` (* required).

**`201 Created`:** created service row.

#### `PUT /services/:id`

Partial update of `service_name`, `service_description`, `price`,
`duration_minutes`, `is_active`. **Auth:** `provider` or `admin`. `404` if missing.

#### `DELETE /services/:id`

**Auth:** `provider` or `admin`.

**`200 OK`:** `{ "message": "Service deleted" }`
**`409`** if the service is referenced by a booking (FK `RESTRICT`) — deactivate
it instead via `PUT … { "is_active": false }`.

---

### Clients

#### `GET /clients`

List all client profiles. **Auth:** `admin`.

#### `GET /clients/:id`

Single client joined with user details. **Auth:** `requireAuth`. `404` if missing.

#### `PUT /clients/:id`

Update `bio` and `profile_picture_url`. **Auth:** owner or `admin`. `403`/`404`
as applicable.

```json
{ "bio": "Loves bold nail art", "profile_picture_url": "https://…/me.jpg" }
```

---

### Bookings

#### `GET /bookings`

List bookings, newest service date first. **Auth:** `requireAuth`.

**Query filters:** `client_id`, `provider_id`, `status` (booking_status enum).

#### `GET /bookings/:id`

Single booking. **Auth:** `requireAuth`. `404` if missing.

#### `POST /bookings`

Create a booking. `provider_id`, `end_time`, `service_price`,
`platform_commission` (15%) and `provider_earnings` are **derived server-side**
from the chosen service so they cannot be tampered with by the client.

**Auth:** `client` or `admin`.

**Body:**

| Field                        | Required | Notes                                   |
| ---------------------------- | -------- | --------------------------------------- |
| `client_id`                  | yes      |                                         |
| `service_id`                 | yes      | Used to look up provider/price/duration |
| `service_date`               | yes      | `YYYY-MM-DD`                            |
| `start_time`                 | yes      | `HH:MM` or `HH:MM:SS`                   |
| `service_location_address`   | yes      |                                         |
| `service_location_latitude`  | no       |                                         |
| `service_location_longitude` | no       |                                         |
| `is_at_provider_location`    | no       | boolean                                 |
| `client_notes`               | no       |                                         |

**Request:**

```bash
curl -b cookies.txt -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "service_id": 1,
    "service_date": "2026-07-01",
    "start_time": "14:00",
    "service_location_address": "12 Riverside Dr"
  }'
```

**`201 Created`:**

```json
{
  "id": 10,
  "client_id": 1,
  "service_id": 1,
  "provider_id": 1,
  "service_date": "2026-07-01T00:00:00.000Z",
  "start_time": "14:00:00",
  "end_time": "14:30:00",
  "service_location_address": "12 Riverside Dr",
  "is_at_provider_location": 0,
  "booking_status": "requested",
  "service_price": "25.00",
  "platform_commission": "3.75",
  "provider_earnings": "21.25"
}
```

**Errors:** `400` missing fields; `404` service not found.

#### `PUT /bookings/:id/status`

Transition the booking state. **Auth:** `requireAuth`.

**Body:** `{ "booking_status": "confirmed", "provider_notes": "See you then" }`
`booking_status` ∈ `requested | confirmed | completed | cancelled | no_show`.

**`200 OK`:** `{ "message": "Booking status updated", "booking_status": "confirmed" }`

#### `DELETE /bookings/:id`

Cancel a booking (sets status `cancelled`, records `cancelled_by` from the
session role, `cancellation_reason`, `cancelled_at`). **Auth:** `requireAuth`.

**Body (optional):** `{ "cancellation_reason": "Client rescheduled" }`

**`200 OK`:** `{ "message": "Booking cancelled" }`

---

### Ratings & reviews

#### `GET /ratings`

List ratings, newest first. **Auth:** none.

**Query filters:** `provider_id`, `client_id`.

#### `POST /ratings`

Rate a completed booking. One rating per booking (`booking_id` is unique).
**Auth:** `client` or `admin`.

**Body:**

| Field                    | Required | Notes                          |
| ------------------------ | -------- | ------------------------------ |
| `booking_id`             | yes      | Unique per booking             |
| `client_id`              | yes      |                                |
| `provider_id`            | yes      |                                |
| `rating_stars`           | yes      | 1–5                            |
| `review_text`            | no       |                                |
| `cleanliness_rating`     | no       | 1–5                            |
| `professionalism_rating` | no       | 1–5                            |
| `punctuality_rating`     | no       | 1–5                            |
| `quality_rating`         | no       | 1–5                            |
| `photo_url`              | no       |                                |

**`201 Created`:** the created rating row.
**Errors:** `400` missing fields / `rating_stars` out of range; `409` booking already rated.

#### `PUT /ratings/:id/response`

Provider replies to a review. **Auth:** `provider` or `admin`.

**Body:** `{ "provider_response": "Thanks for visiting!" }`

**`200 OK`:** `{ "message": "Response saved" }` — `404` if rating not found.

---

### Availability slots

#### `GET /availability`

List a provider's availability slots, ordered by date/time. **Auth:** none.

**Query:** `provider_id` (**required**), `only_available` (`1`/`true`).

```bash
curl "http://localhost:3000/availability?provider_id=1&only_available=1"
```

`400` if `provider_id` is omitted.

#### `POST /availability`

**Auth:** `provider` or `admin`.

**Body:** `{ "provider_id", "available_date", "start_time", "end_time" }` (all required).

**`201 Created`:** created slot row.

#### `PUT /availability/:id`

Partial update of `available_date`, `start_time`, `end_time`, `is_available`.
**Auth:** `provider` or `admin`. `404` if missing.

#### `DELETE /availability/:id`

**Auth:** `provider` or `admin`. **`200 OK`:** `{ "message": "Slot deleted" }`

---

### Favorites

#### `GET /favorites`

List a client's favorite providers (joined with `business_name`,
`primary_category`). **Auth:** `requireAuth`.

**Query:** `client_id` (**required**). `400` if omitted.

#### `POST /favorites`

**Auth:** `client` or `admin`.

**Body:** `{ "client_id", "provider_id" }`

**`201 Created`:** `{ "id": 7, "client_id": 1, "provider_id": 1 }`
**`409`** if already favorited (unique constraint).

#### `DELETE /favorites/:id`

**Auth:** `client` or `admin`. **`200 OK`:** `{ "message": "Removed from favorites" }`

---

## Error reference

All errors return JSON in the shape:

```json
{ "error": "Human-readable message" }
```

| Scenario                                  | Status | Message example                          |
| ----------------------------------------- | ------ | ---------------------------------------- |
| Missing required body fields              | 400    | `"Missing required fields"`              |
| Invalid enum value                        | 400    | `"Invalid user_type"`                    |
| No session / not logged in                | 401    | `"Not authenticated"`                    |
| Wrong credentials on login                | 401    | `"Invalid credentials"`                  |
| Role not permitted                        | 403    | `"Forbidden: insufficient role"`         |
| Editing another user's resource           | 403    | `"Forbidden"`                            |
| Resource missing                          | 404    | `"Provider not found"`                   |
| Unknown route                             | 404    | `"Route not found"`                      |
| Duplicate unique value (email/phone/etc.) | 409    | `"Email or phone already registered"`    |
| Deleting a service with bookings          | 409    | `"Service has bookings; deactivate it instead"` |
| Unexpected DB/server failure              | 500    | `"Internal Server Error"`                |

---

## Endpoint summary

| Method   | Path                                | Auth              |
| -------- | ----------------------------------- | ----------------- |
| GET      | `/`                                 | none              |
| POST     | `/auth/register`                    | none              |
| POST     | `/auth/login`                       | none              |
| POST     | `/auth/logout`                      | session           |
| GET      | `/auth/me`                          | any               |
| GET      | `/users`                            | admin             |
| GET      | `/users/:id`                        | any               |
| PUT      | `/users/:id`                        | owner / admin     |
| DELETE   | `/users/:id`                        | admin             |
| GET      | `/service-providers`                | none              |
| GET      | `/service-providers/:id`            | none              |
| POST     | `/service-providers`                | provider / admin  |
| PUT      | `/service-providers/:id`            | owner / admin     |
| PUT      | `/service-providers/:id/approval`   | admin             |
| DELETE   | `/service-providers/:id`            | owner / admin     |
| GET      | `/services`                         | none              |
| GET      | `/services/:id`                     | none              |
| POST     | `/services`                         | provider / admin  |
| PUT      | `/services/:id`                     | provider / admin  |
| DELETE   | `/services/:id`                     | provider / admin  |
| GET      | `/clients`                          | admin             |
| GET      | `/clients/:id`                      | any               |
| PUT      | `/clients/:id`                      | owner / admin     |
| GET      | `/bookings`                         | any               |
| GET      | `/bookings/:id`                     | any               |
| POST     | `/bookings`                         | client / admin    |
| PUT      | `/bookings/:id/status`              | any               |
| DELETE   | `/bookings/:id`                     | any               |
| GET      | `/ratings`                          | none              |
| POST     | `/ratings`                          | client / admin    |
| PUT      | `/ratings/:id/response`             | provider / admin  |
| GET      | `/availability`                     | none              |
| POST     | `/availability`                     | provider / admin  |
| PUT      | `/availability/:id`                 | provider / admin  |
| DELETE   | `/availability/:id`                 | provider / admin  |
| GET      | `/favorites`                        | any               |
| POST     | `/favorites`                        | client / admin    |
| DELETE   | `/favorites/:id`                    | client / admin    |
