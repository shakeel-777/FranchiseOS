# FranchiseOS — Enterprise Franchise Operations Platform

A full-stack franchise management system.
- **Frontend:** Vanilla HTML/CSS/JavaScript (single-page app, hash-based routing) — no frameworks.
- **Backend:** Django REST Framework + SimpleJWT (JWT auth), CORS enabled.
- **Database:** SQLite (zero config, works identically on Windows and Linux).

---

## 1. Backend Setup

Open a terminal in the `backend/` folder.

### Linux / macOS
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

### Windows (PowerShell or CMD)
```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

The API will be running at **http://127.0.0.1:8000/**.

`python manage.py seed_data` creates the required login accounts and demo data
(franchises, products, inventory, sales, expenses, approvals, compliance,
campaigns, notifications, audit log). It is safe to re-run.

---

## 2. Frontend Setup

The frontend is plain static files (`index.html`, `css/`, `js/`) — no build step.
Open `index.html` directly in a browser, **or** serve it with a simple static
server (recommended, avoids any `file://` restrictions in some browsers):

```bash
# from the project root, in a second terminal
python -m http.server 5500
```
Then visit **http://127.0.0.1:5500/**.

The frontend talks to the backend at `http://127.0.0.1:8000/api` (configured
in `js/store.js`). Keep the Django server running while using the app.

---

## 3. Account Access

There are no hardcoded/demo logins baked into the app. To get in:

- **Register** a new account from the **Sign Up** page. New accounts start as
  plain `staff` with no franchise assigned, so franchise-operations pages
  (Franchises, Products, Inventory, Sales, Expenses, Approvals, Compliance,
  Marketing, Reports) stay **locked** — visible in the sidebar but disabled —
  until an admin approves the account.
- **Admin approval**: an existing admin account signs in, opens **Users**,
  opens the pending account, and assigns it a franchise (and role, if needed).
  Once saved, those modules unlock for that user automatically on their next
  page load/login — no code changes required.
- **First admin account**: run `python manage.py createsuperuser` (or promote
  an existing account's `role` to `admin` via the Django admin at `/admin/`)
  to get your first corporate admin.

---

## 4. Project Structure

```
index.html          Single-page app shell (sidebar/header/router mount)
css/                 Design tokens, layout, components, landing, dashboard styles
js/                  One file per module (auth, dashboard, franchises, sales, ...)
backend/
  core/              Django project settings + URL routing
  accounts/          Users, profiles, auth, user management
  franchises/ ...    One Django app per business module (CRUD via DRF routers)
  requirements.txt
  manage.py
```

Every module (Franchises, Users, Products, Inventory, Sales, Expenses,
Approvals, Compliance, Marketing, Reports, Audit Log, Notifications,
Settings) has a real Django REST endpoint under `/api/...`
and a matching frontend page — nothing is mocked.

## 5. Notes
- Admin accounts see and can manage all franchises. Non-admin accounts are
  automatically scoped to their own franchise on every module (enforced
  server-side, not just hidden in the UI).
- JWT access tokens last 8 hours; refresh tokens last 7 days.
- `DEBUG = True` and a permissive `SECRET_KEY`/CORS policy are set for local
  development only — rotate these before any real deployment.
