# UML Design & Testing Documentation

**Project:** Community Event Management System  
**Technology Stack:** Node.js / Express / SQLite (better-sqlite3) / EJS  
**Date:** July 2026

---

## Table of Contents

1. [UML Diagrams](#1-uml-diagrams)
   - 1.1 [Entity-Relationship Diagram](#11-entity-relationship-diagram)
   - 1.2 [Use Case Diagram](#12-use-case-diagram)
   - 1.3 [Class Diagram](#13-class-diagram)
   - 1.4 [Sequence Diagrams](#14-sequence-diagrams)
2. [Test Documentation](#2-test-documentation)
   - 2.1 [Test Strategy](#21-test-strategy)
   - 2.2 [Automated Test Plan](#22-automated-test-plan)
   - 2.3 [Manual Test Plan](#23-manual-test-plan)
   - 2.4 [Test Coverage Summary](#24-test-coverage-summary)

---

# 1. UML Diagrams

## 1.1 Entity-Relationship Diagram

The ER diagram below models the full relational schema of the Community Event Management System. It includes seven tables covering users, events, venues, activities, and the junction tables that represent many-to-many relationships.

```mermaid
erDiagram

    users {
        INTEGER id PK
        TEXT name
        TEXT email UK
        TEXT phone
        TEXT password_hash
        TEXT role
        DATETIME created_at
    }

    events {
        INTEGER id PK
        TEXT name
        TEXT description
        TEXT date
        TEXT time
        INTEGER created_by FK
        DATETIME created_at
    }

    venues {
        INTEGER id PK
        TEXT name
        TEXT address
        INTEGER capacity
    }

    activities {
        INTEGER id PK
        TEXT name
        TEXT description
    }

    registrations {
        INTEGER id PK
        INTEGER participant_id FK
        INTEGER event_id FK
        DATETIME registration_date
        TEXT status
    }

    event_venues {
        INTEGER event_id FK
        INTEGER venue_id FK
    }

    event_activities {
        INTEGER event_id FK
        INTEGER activity_id FK
    }

    users ||--o{ registrations : "registers for"
    events ||--o{ registrations : "has"
    users ||--o{ events : "creates"
    events ||--o{ event_venues : "held at"
    venues ||--o{ event_venues : "hosts"
    events ||--o{ event_activities : "includes"
    activities ||--o{ event_activities : "part of"
```

### Relationship Summary

| Relationship | Type | Description |
|---|---|---|
| users → events | One-to-Many | A user (admin) can create many events |
| users → registrations | One-to-Many | A user can register for many events |
| events → registrations | One-to-Many | An event can have many registrations |
| events ↔ venues | Many-to-Many | An event can use multiple venues; a venue can host multiple events (via `event_venues`) |
| events ↔ activities | Many-to-Many | An event can include multiple activities; an activity can belong to multiple events (via `event_activities`) |

---

## 1.2 Use Case Diagram

Since Mermaid does not natively support UML use case diagrams, the diagram below uses a flowchart to represent actors and their associated use cases.

```mermaid
flowchart LR
    subgraph Actors
        G["🧑 Guest<br/>(Not Logged In)"]
        U["👤 User<br/>(Logged In)"]
        A["🔑 Admin"]
    end

    subgraph Guest_UseCases["Guest Use Cases"]
        G1["View Events Listing"]
        G2["View Event Details"]
        G3["Register Account"]
        G4["Login"]
    end

    subgraph User_UseCases["User Use Cases"]
        U1["Register for Event"]
        U2["Unregister from Event"]
        U3["View My Registrations"]
        U4["Logout"]
    end

    subgraph Admin_UseCases["Admin Use Cases"]
        A1["Create Event"]
        A2["Edit Event"]
        A3["Delete Event"]
        A4["Manage Participants"]
        A5["Manage Venues"]
        A6["Manage Activities"]
        A7["View Admin Dashboard"]
    end

    G --> G1
    G --> G2
    G --> G3
    G --> G4

    U --> G1
    U --> G2
    U --> U1
    U --> U2
    U --> U3
    U --> U4

    A --> G1
    A --> G2
    A --> U1
    A --> U2
    A --> U3
    A --> U4
    A --> A1
    A --> A2
    A --> A3
    A --> A4
    A --> A5
    A --> A6
    A --> A7
```

### Actor Descriptions

| Actor | Description | Permissions |
|---|---|---|
| **Guest** | Unauthenticated visitor | View events, register account, login |
| **User** | Authenticated regular user | All Guest permissions + register/unregister for events, view personal registrations, logout |
| **Admin** | Authenticated administrator | All User permissions + full CRUD on events, venues, activities; participant management; dashboard access |

---

## 1.3 Class Diagram

The class diagram below illustrates the main architectural components of the application, including the database access layer, route handlers, and middleware.

```mermaid
classDiagram
    class Database {
        -SQLite db
        +pragma(setting)
        +exec(sql)
        +prepare(sql) Statement
        +close()
    }

    class App {
        -Express app
        +use(middleware)
        +listen(port)
        +set(key, value)
    }

    class AuthRouter {
        +GET /register
        +POST /register
        +GET /login
        +POST /login
        +GET /logout
    }

    class EventRouter {
        +GET /events
        +GET /events/:id
        +GET /events/create
        +POST /events
        +GET /events/:id/edit
        +POST /events/:id
        +POST /events/:id/delete
    }

    class RegistrationRouter {
        +POST /events/:id/register
        +POST /events/:id/unregister
        +GET /my-registrations
    }

    class AdminRouter {
        +GET /admin/dashboard
        +GET /admin/venues
        +POST /admin/venues
        +POST /admin/venues/:id/edit
        +POST /admin/venues/:id/delete
        +GET /admin/activities
        +POST /admin/activities
        +POST /admin/activities/:id/edit
        +POST /admin/activities/:id/delete
        +GET /admin/events/:id/participants
    }

    class Middleware {
        +requireLogin(req, res, next)
        +requireAdmin(req, res, next)
        +setLocals(req, res, next)
    }

    App --> AuthRouter : mounts
    App --> EventRouter : mounts
    App --> RegistrationRouter : mounts
    App --> AdminRouter : mounts
    App --> Middleware : uses

    AuthRouter --> Database : queries users
    EventRouter --> Database : queries events, event_venues, event_activities
    RegistrationRouter --> Database : queries registrations
    AdminRouter --> Database : queries venues, activities, registrations

    Middleware --> Database : verifies session
    AdminRouter --> Middleware : requireAdmin
    RegistrationRouter --> Middleware : requireLogin
    EventRouter --> Middleware : requireLogin (create/edit/delete)
```

---

## 1.4 Sequence Diagrams

### 1.4.1 User Registration for Event

This diagram shows the flow when a logged-in user registers for a community event.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Express as Express Server
    participant Auth as Auth Middleware
    participant Route as Event Route
    participant DB as SQLite Database

    User->>Browser: Click "Register" on event page
    Browser->>Express: POST /events/:id/register
    Express->>Auth: requireLogin(req, res, next)
    
    alt User not logged in
        Auth-->>Browser: 302 Redirect to /auth/login
    else User authenticated
        Auth->>Route: next()
        Route->>DB: SELECT from registrations WHERE participant_id AND event_id
        
        alt Already registered
            DB-->>Route: Existing registration found
            Route-->>Browser: 302 Redirect with flash error
        else Not yet registered
            DB-->>Route: No existing registration
            Route->>DB: INSERT INTO registrations (participant_id, event_id, status)
            DB-->>Route: Registration created
            Route-->>Browser: 302 Redirect to event page with success flash
        end
    end

    Browser-->>User: Display updated event page
```

### 1.4.2 Admin Creating Event

This diagram shows the flow when an admin creates a new event with associated venues and activities.

```mermaid
sequenceDiagram
    actor Admin
    participant Browser
    participant Express as Express Server
    participant AuthMW as Auth Middleware
    participant AdminMW as Admin Middleware
    participant Route as Event Route
    participant DB as SQLite Database

    Admin->>Browser: Fill in event form and submit
    Browser->>Express: POST /events (name, description, date, time, venues[], activities[])
    Express->>AuthMW: requireLogin(req, res, next)
    
    alt Not logged in
        AuthMW-->>Browser: 302 Redirect to /auth/login
    else Authenticated
        AuthMW->>AdminMW: next()
        AdminMW->>AdminMW: Check req.session.user.role === 'admin'
        
        alt Not admin
            AdminMW-->>Browser: 403 Forbidden
        else Is admin
            AdminMW->>Route: next()
            
            Route->>DB: INSERT INTO events (name, desc, date, time, created_by)
            DB-->>Route: Return new event ID
            
            loop For each selected venue
                Route->>DB: INSERT INTO event_venues (event_id, venue_id)
                DB-->>Route: OK
            end
            
            loop For each selected activity
                Route->>DB: INSERT INTO event_activities (event_id, activity_id)
                DB-->>Route: OK
            end
            
            Route-->>Browser: 302 Redirect to /events/:newId
        end
    end

    Browser-->>Admin: Display new event page with success message
```

### 1.4.3 User Login Flow

This diagram shows the complete authentication flow for user login.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Express as Express Server
    participant Route as Auth Route
    participant DB as SQLite Database
    participant Bcrypt as bcrypt

    User->>Browser: Enter email and password, click Login
    Browser->>Express: POST /auth/login (email, password)
    Express->>Route: Handle login request

    Route->>DB: SELECT * FROM users WHERE email = ?
    
    alt User not found
        DB-->>Route: No rows returned
        Route-->>Browser: 302 Redirect to /auth/login with flash "Invalid credentials"
    else User found
        DB-->>Route: Return user row (id, name, email, password_hash, role)
        Route->>Bcrypt: bcrypt.compareSync(password, user.password_hash)
        
        alt Password mismatch
            Bcrypt-->>Route: false
            Route-->>Browser: 302 Redirect to /auth/login with flash "Invalid credentials"
        else Password matches
            Bcrypt-->>Route: true
            Route->>Express: req.session.user = { id, name, email, role }
            Express-->>Browser: 302 Redirect to /events
            Note over Browser: Session cookie set
        end
    end

    Browser-->>User: Display events page or login error
```

---

# 2. Test Documentation

## 2.1 Test Strategy

### Overview

The Community Event Management System employs a multi-layered testing strategy to ensure correctness, security, and usability:

| Layer | Tool | Scope |
|---|---|---|
| **Unit / Integration Tests** | Jest + Supertest | HTTP route handlers, middleware, database operations |
| **Manual Functional Tests** | Browser-based | End-to-end UI workflows, visual verification |
| **Database Tests** | In-memory SQLite | Schema integrity, constraint enforcement |

### Testing Principles

- **Isolation** — Each test runs against a fresh in-memory SQLite database to prevent cross-test contamination.
- **Session Simulation** — Supertest agents maintain cookies across requests to test session-based authentication.
- **Deterministic Data** — A `seedTestData()` helper inserts a predictable dataset before each test.
- **Coverage Areas:**
  - ✅ Authentication (register, login, logout, protected routes)
  - ✅ CRUD Operations (events, venues, activities)
  - ✅ Authorization (admin vs. regular user permissions)
  - ✅ Registration workflows (register, unregister, duplicate prevention)
  - ✅ Edge cases (invalid input, non-existent resources, empty filters)

### Test Files

| File | Description |
|---|---|
| `tests/setup.js` | Shared test harness — in-memory DB, seed data, app bootstrap |
| `tests/auth.test.js` | Authentication flow tests |
| `tests/events.test.js` | Event CRUD and filtering tests |
| `tests/registrations.test.js` | Event registration workflow tests |

---

## 2.2 Automated Test Plan

The table below documents all automated test cases implemented in the Jest test suite.

| Test ID | Test Description | Module | Expected Result | Status |
|---|---|---|---|---|
| AUTH-01 | Register with valid user data | Auth | 302 redirect (account created) | ✅ Implemented |
| AUTH-02 | Register with duplicate email | Auth | Error response (400/409 or redirect with flash) | ✅ Implemented |
| AUTH-03 | Login with valid credentials | Auth | 302 redirect to /events | ✅ Implemented |
| AUTH-04 | Login with wrong password | Auth | Error response (401 or redirect to /login) | ✅ Implemented |
| AUTH-05 | Logout destroys session | Auth | 302 redirect to / or /login | ✅ Implemented |
| AUTH-05b | Access protected route without auth | Auth | 302 redirect to /login | ✅ Implemented |
| EVT-01 | List all events | Events | 200 OK, response contains event names | ✅ Implemented |
| EVT-02 | View event detail page | Events | 200 OK, response contains event info | ✅ Implemented |
| EVT-03 | Access create event page without auth | Events | 302 redirect to login | ✅ Implemented |
| EVT-04 | Admin creates a new event | Events | 201/302 (event created, redirect) | ✅ Implemented |
| EVT-05 | Filter events by date (matching) | Events | 200 OK, matching events shown | ✅ Implemented |
| EVT-05b | Filter events by date (no match) | Events | 200 OK, no matching events | ✅ Implemented |
| EVT-06 | Admin deletes an event | Events | 200/302 (event removed, redirect) | ✅ Implemented |
| REG-01 | User registers for event | Registrations | 200/302 (registration created) | ✅ Implemented |
| REG-02 | Prevent duplicate registration | Registrations | Error (400/409 or redirect with flash) | ✅ Implemented |
| REG-03 | User unregisters from event | Registrations | 200/302 (registration removed) | ✅ Implemented |
| REG-04 | View My Registrations (authenticated) | Registrations | 200 OK | ✅ Implemented |
| REG-05 | View My Registrations (unauthenticated) | Registrations | 302 redirect to login | ✅ Implemented |

### Running Tests

```bash
# Run the full test suite
npm test

# Or directly
npx jest --verbose --forceExit --detectOpenHandles
```

---

## 2.3 Manual Test Plan

The following manual tests are designed to validate the full end-to-end user experience through a browser. These tests should be executed once the application is deployed and running.

| Test ID | Test Case | Steps | Expected Outcome | Actual Outcome | Pass/Fail |
|---|---|---|---|---|---|
| MT-01 | Register new user account | 1. Navigate to /auth/register<br>2. Fill in name, email, phone, password<br>3. Click "Register" | Account is created; user is redirected to login or events page with success message | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-02 | Login with valid credentials | 1. Navigate to /auth/login<br>2. Enter valid email and password<br>3. Click "Login" | User is logged in and redirected to /events; navigation shows user's name | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-03 | Login with invalid credentials (wrong password) | 1. Navigate to /auth/login<br>2. Enter valid email but wrong password<br>3. Click "Login" | Error flash message displayed; user remains on login page | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-04 | Browse events listing page | 1. Navigate to /events<br>2. Observe the page content | All events are displayed in a list/grid with name, date, time, and venue information | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-05 | Filter events by date | 1. Navigate to /events<br>2. Select a date in the filter form<br>3. Submit the filter | Only events matching the selected date are displayed | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-06 | Filter events by venue | 1. Navigate to /events<br>2. Select a venue from the dropdown filter<br>3. Submit the filter | Only events at the selected venue are displayed | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-07 | View event detail page | 1. Navigate to /events<br>2. Click on an event name/card<br>3. Observe the detail page | Event details shown including name, description, date, time, venue(s), activity(ies), and registration button | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-08 | Register for an event | 1. Login as a regular user<br>2. Navigate to an event detail page<br>3. Click "Register for Event" | Registration is confirmed; success message shown; registration appears in My Registrations | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-09 | View My Registrations page | 1. Login as a regular user<br>2. Navigate to /my-registrations | All user's current registrations are listed with event name, date, and status | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-10 | Unregister from an event | 1. Login as a regular user<br>2. Navigate to /my-registrations or event detail<br>3. Click "Unregister" or "Cancel Registration" | Registration is removed; success message shown; event no longer appears in My Registrations | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-11 | Admin create new event with venues and activities | 1. Login as admin<br>2. Navigate to /events/create<br>3. Fill in event details, select venue(s) and activity(ies)<br>4. Submit the form | Event is created with associated venues and activities; redirected to event detail page | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-12 | Admin edit existing event | 1. Login as admin<br>2. Navigate to an event detail page<br>3. Click "Edit"<br>4. Modify fields and submit | Event is updated with new values; changes reflected on detail page | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-13 | Admin delete event | 1. Login as admin<br>2. Navigate to an event detail page<br>3. Click "Delete"<br>4. Confirm deletion | Event is removed from the system; redirected to events listing; event no longer appears | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-14 | Admin manage venues (add, edit, delete) | 1. Login as admin<br>2. Navigate to /admin/venues<br>3. Add a new venue with name, address, capacity<br>4. Edit an existing venue<br>5. Delete a venue | Venue is created, updated, and deleted successfully; changes reflected in venue list and event forms | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-15 | Admin manage activities (add, edit, delete) | 1. Login as admin<br>2. Navigate to /admin/activities<br>3. Add a new activity with name and description<br>4. Edit an existing activity<br>5. Delete an activity | Activity is created, updated, and deleted successfully; changes reflected in activity list and event forms | TBD - To be completed during testing | TBD - To be completed during testing |
| MT-16 | Non-admin user cannot access admin pages | 1. Login as a regular user (role: 'user')<br>2. Attempt to navigate to /admin/dashboard, /admin/venues, /admin/activities<br>3. Attempt to POST to admin-only routes | Access is denied (403 or redirect to /events); admin pages and operations are inaccessible | TBD - To be completed during testing | TBD - To be completed during testing |

---

## 2.4 Test Coverage Summary

### Areas Covered

| Area | Automated | Manual | Notes |
|---|---|---|---|
| User Registration | ✅ | ✅ | Valid and duplicate-email scenarios |
| User Login | ✅ | ✅ | Valid credentials, wrong password |
| User Logout | ✅ | — | Session destruction verified |
| Protected Routes | ✅ | ✅ | Redirect to login when unauthenticated |
| Event Listing | ✅ | ✅ | Basic listing with event data |
| Event Detail | ✅ | ✅ | Individual event page |
| Event Creation (Admin) | ✅ | ✅ | With venue and activity associations |
| Event Editing (Admin) | — | ✅ | Manual test only |
| Event Deletion (Admin) | ✅ | ✅ | Cascade deletion of associations |
| Event Filtering | ✅ | ✅ | By date; manual also by venue |
| Event Registration | ✅ | ✅ | Register and duplicate prevention |
| Event Unregistration | ✅ | ✅ | Remove registration |
| My Registrations | ✅ | ✅ | Authenticated and unauthenticated access |
| Venue Management | — | ✅ | Admin CRUD via browser |
| Activity Management | — | ✅ | Admin CRUD via browser |
| Admin Authorization | — | ✅ | Non-admin denied access |

### Known Limitations

1. **No Visual/CSS Testing** — Automated tests do not verify visual layout or styling. UI correctness is validated only through manual testing.
2. **No Load/Stress Testing** — The current suite does not test performance under high concurrency. This is acceptable for a university project scope.
3. **Event Editing** — Automated test for editing events is not implemented; covered by manual testing (MT-12).
4. **Venue/Activity CRUD** — Automated tests for admin venue and activity management are not included; these are fully covered by manual tests (MT-14, MT-15).
5. **Flash Messages** — Tests verify HTTP status codes and redirects but do not assert on flash message content rendered in EJS templates.

### Running the Test Suite

```bash
# Install dependencies (if not done)
npm install

# Run all automated tests
npm test

# Generate coverage report (optional)
npx jest --coverage --forceExit --detectOpenHandles
```

---

*Document prepared for COMP/IT coursework — Community Event Management System.*
