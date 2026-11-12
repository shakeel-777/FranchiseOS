# FranchiseOS — Enterprise Franchise Operations Platform

> **Academic Year 2026–2027** · Course Code: **25BRI3CV** (Industrial Training)  
> **Rathinam College of Arts and Science (Autonomous)**, Coimbatore  
> **Department of Computer Science**

---

## 👥 Team 13 — Project Presenters

| Member Name | Register Number | Branch Code | Assigned Role in System |
|---|---|---|---|
| **VINAY** | `RCAS2025BAR213` | `[BAR]` | Franchise Owner (Domino's) |
| **MATHAN** | `RCAS2025BAR221` | `[BAR]` | Franchise Owner (KFC) |
| **RAMAGURU** | `RCAS2025BAI230` | `[BAI]` | Store Manager (Street Arabiya) |
| **DANISKA** | `RCAS2025BCY206` | `[BCY]` | Store Manager (Pothys) |
| **SHAKEEL** | `RCAS2025BCY212` | `[BCY]` | Corporate Admin / Superuser |

---

## 🚀 One-Click Quick Start (Windows & Linux)

FranchiseOS includes automated cross-platform startup scripts that handle virtual environment creation, Python dependencies, database migrations, demo data seeding, frontend dependencies, and simultaneous server orchestration.

### 🐧 Linux & macOS
```bash
git clone https://github.com/shakeel-777/FranchiseOS.git
cd FranchiseOS
chmod +x run.sh
./run.sh
```

### 🪟 Windows (Command Prompt or File Explorer)
Double-click `run.bat` **or** open CMD:
```cmd
git clone https://github.com/shakeel-777/FranchiseOS.git
cd FranchiseOS
run.bat
```

### ⚡ Windows (PowerShell)
```powershell
git clone https://github.com/shakeel-777/FranchiseOS.git
cd FranchiseOS
.\run.ps1
```

Once running:
* **Frontend Single-Page App:** [http://localhost:5501](http://localhost:5501)
* **Backend Django REST API:** [http://localhost:8001/api/](http://localhost:8001/api/)
* **Django Administration:** [http://localhost:8001/admin/](http://localhost:8001/admin/)

---

## 🔑 Pre-Seeded Team Logins

Each member has a dedicated operational account with role-based access control (RBAC):

| Username | Password | Role | Scoped Franchise / Access Level |
|---|---|---|---|
| `shakeel` | `admin123` | **Corporate Admin** | Network-wide full access, approvals, settings |
| `vinay` | `vinay123` | **Franchise Owner** | Domino's Pizza (`DOM01`) catalog, sales, expenses |
| `mathan` | `mathan123` | **Franchise Owner** | KFC (`KFC01`) catalog, sales, expenses |
| `ramaguru` | `ramaguru123` | **Store Manager** | Street Arabiya (`STA01`) POS billing, stock entry |
| `daniska` | `daniska123` | **Store Manager** | Pothys (`POT01`) POS billing, stock entry |

---

## 🏗️ Architecture & Technology Stack

FranchiseOS is built on a decoupled, enterprise multi-tenant architecture:

```
[ React 19 + Vite SPA ]  <--- HTTP REST (JWT) ---> [ Django REST Framework ]
         |                                                   |
         +--- Bi-directional WebSockets (ws://) ---> [ Daphne ASGI + Channels ]
                                                             |
                                               [ SQLite Dev / PostgreSQL Prod ]
```

* **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, HTML5 WebSockets.
* **Backend:** Python 3.11+, Django 5.0, Django REST Framework, SimpleJWT.
* **Real-time Pipeline:** Daphne ASGI Server, Django Channels 4.0.
* **Security:** PBKDF2 password hashing, 8-hour access tokens, server-enforced queryset isolation.
* **Database:** 18 normalized relational models with foreign-key referential integrity.

---

## 🧪 Automated Testing

Run the automated test suite from the `backend/` directory:

```bash
cd backend
python manage.py test
```

All unit tests and integration tests validate:
1. User registration, profile linkage, and JWT token authentication.
2. Multi-tenant franchise queryset scoping (preventing cross-outlet data leakage).
3. POS sale creation and automated line item total calculation.
4. Inventory low-stock threshold triggers.
5. Approval workflow state transitions (`pending` -> `approved`).
6. Compliance checklist item completion tracking.

---

## 📁 Repository Structure

```
FranchiseOS/
├── backend/                  # Django REST Framework backend
│   ├── core/                 # ASGI/WSGI settings, URL routing
│   ├── accounts/             # Authentication, RBAC, seed_data command
│   ├── franchises/           # Franchise registry & tenant models
│   ├── products/             # Product catalog per franchise
│   ├── inventory/            # Stock tracking & low-stock alerts
│   ├── sales/                # POS billing & order line items
│   ├── expenses/             # Operational expense tracking
│   ├── approvals/            # Hierarchical approval pipeline
│   ├── compliance/           # Safety & audit checklists
│   ├── marketing/            # Promotional campaign tracker
│   ├── reports/              # Aggregated KPI & financial analytics
│   ├── notifications/        # Real-time event notifications
│   ├── audit/                # Immutable action audit logging
│   ├── ai_assistant/         # Operations Q&A intelligence
│   └── chat/                 # WebSocket live messaging
├── src/                      # React 19 Single-Page App
│   ├── pages/                # App route components
│   ├── components/           # Reusable UI widgets & modals
│   ├── api/                  # Axios/fetch API clients
│   └── styles/               # CSS modules & design tokens
├── presentation_assets/      # Official UI screenshots & college insignia
├── run.sh                    # Linux/macOS one-click launcher
├── run.bat                   # Windows CMD one-click launcher
├── run.ps1                   # Windows PowerShell one-click launcher
└── README.md                 # Project documentation
```

---

## 📄 License & Academic Integrity

Developed for the Industrial Training Curriculum (Course: 25BRI3CV) at Rathinam College of Arts and Science (Autonomous). All rights reserved.
