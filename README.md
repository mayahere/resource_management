# HRRAMS - HR Resource Allocation Management System

**HRRAMS** (HR Resource Allocation Management System) is a modern web application designed to help Project Managers (PMs) and Administrators efficiently allocate, track, and manage software project human resources. The system automates available effort calculations, dynamically determines employee experience levels, checks resource constraints to prevent over-allocation, and automatically releases resources when project periods expire.

---

## Key Features

- 🔐 **Role-Based Access Control (RBAC)**: Supports roles with specific permissions including **Admin**, **Project Manager**, **Developer**, **Tester**, and **Business Analyst**.
- 📊 **Dynamic Resource Dashboard**: Displays high-level stats (Total Resources, Available Resources, Fully Allocated) and an interactive employee availability grid with robust filters (Specialization, Experience Level, Availability).
- 📂 **Project & Requirement Management**: Allows Admins to create and manage projects, assign Project Managers, and define dynamic role-based resource demands (e.g., Back-end Developer: 200%, QA: 50%).
- ⚡ **Resource Requests & Approvals Flow**: PMs can request resource allocations. The system authoritatively validates allocations to ensure:
  - The request fits within the employee's available effort (total allocation cannot exceed 100% capacity at any point in time).
  - The allocation dates fall strictly within the project's start and end dates.
  - Requests start as `Pending` and are approved/rejected by an Administrator.
- 🕒 **Auto Resource Release**: Allocations are automatically updated to `Released` status once their end date passes, immediately reclaiming effort back to the employee's availability pool.
- 👤 **Employee CRUD Panel**: Provides Admins with a dashboard to manage users, reset passwords, change system roles, assign specializations, adjust contract dates, and soft-delete accounts.

---

## Technology Stack

### Frontend
- **Framework**: React (built with Vite)
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Icons**: Lucide React

### Backend & Database
- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL (running in Docker Compose)
- **ORM**: Prisma (supporting easy migrations and seeding)
- **Security**: JWT session tokens and Bcrypt password hashing

---

## Project Structure

```
resource_management/
├── backend/                  # Node.js + Express API server
│   ├── prisma/               # Prisma schema, migrations, and seeding scripts
│   │   ├── schema.prisma     # Database schema definition
│   │   └── seed.ts           # Initial mock database seed
│   ├── src/
│   │   ├── index.ts          # Server entrypoint and auto-release cron
│   │   ├── middleware/       # Authentication and role guards
│   │   └── routes/           # Auth, User, Employee, Project, Allocation routers
│   ├── Dockerfile            # Container build for backend
│   └── tsconfig.json         # Backend TS compiler options
│
├── frontend/                 # React SPA frontend
│   ├── src/
│   │   ├── components/       # Reusable components (Sidebar, Badge, Modals)
│   │   ├── views/            # Main views (Dashboard, Projects, Employees CRUD, Login)
│   │   ├── App.tsx           # Application shell and API fetch coordinator
│   │   └── types.ts          # Shared TypeScript type definitions
│   ├── Dockerfile            # Container build for frontend
│   └── vite.config.ts        # Vite build tool config (with proxy on port 5001)
│
├── docker-compose.yml        # Complete system orchestration (Postgres, backend, frontend)
└── README.md                 # Product overview and onboarding guide
```

---

## Getting Started

Follow these steps to set up and run the system locally on your machine.

### Prerequisites
- **Docker** and **Docker Compose**
- **Node.js** (v18 or higher recommended, only if running services individually)

---

### Option A: Run the Entire Stack via Docker Compose (Recommended)
You can spin up the database, backend server, and frontend web application all at once with a single command from the project root:

```bash
docker compose up --build
```

This will:
1. Start the PostgreSQL database container.
2. Build and start the backend service (automatically pushes the schema, seeds the mock data, and runs on `http://localhost:5001`).
3. Build and start the frontend application (runs the dev server on `http://localhost:5173`).

Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

### Option B: Run Services Individually (For Development)

If you prefer to run services manually for code editing:

#### 1. Start the Database
Start only the PostgreSQL database container from the root directory:
```bash
docker compose up -d postgres
```
This runs PostgreSQL on `localhost:5432`.

#### 2. Set Up and Start the Backend Server
Navigate to the `backend` folder, install packages, run database migrations, seed data, and start the development server:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
The backend server runs on `http://localhost:5001`.

#### 3. Set Up and Start the Frontend Client
Open a new terminal window, navigate to the `frontend` folder, install packages, and start the dev server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## Testing & Demo Accounts

The database is pre-populated with default credentials so you can log in immediately. Passwords for all accounts below is: **`password123`**

| Email | Role | Features Available |
| :--- | :--- | :--- |
| **`admin@hrrams.local`** | **Admin** | Can approve/reject resource requests, CRUD users/employees, CRUD projects, and see all allocations. |
| **`alice.pm@hrrams.local`** | **Project Manager** | Can view assigned projects, check available employees, and request resource allocations. |
| **`bob.pm@hrrams.local`** | **Project Manager** | Can view assigned projects, check available employees, and request resource allocations. |

### Verification Logic to Try:
1. **Exceeding Available Capacity (Rule 1 & 3)**: Log in as a PM. Try to request **Nguyen Van A** for 50% effort. The system will fail and show a warning because he is already allocated to Project 1 (50%) and Project 3 (30%), leaving only 20% available effort.
2. **Invalid Dates Range (Rule 2)**: Try to allocate an employee to a project for dates outside the project's timeline (e.g. into 2027 when the project ends in 2026). The API will reject the request.
3. **Approve Request**: Create a valid request as a PM. Log out and sign in as the **Admin**. You will see the pending request at the top of the dashboard. Click **Approve** and watch the employee's available effort update instantly!
