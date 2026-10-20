# DentalCare — Clinic Management System 🦷

A full-featured Dental Management System built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Neon PostgreSQL**.

---

## 🌟 Key Features

1. **Dashboard Overview**: Live KPI statistics (Patients, Appointments, Monthly Revenue, Pending Invoices, Outstanding Balances), 6-month revenue trends, appointment status breakdowns, and recent patients.
2. **Patient Management**: Full patient records, contact info, medical history, allergies, emergency contacts, insurance details, search & filter.
3. **Appointment Scheduling**: Doctor assignment, treatment selection, status tracking (Scheduled, Confirmed, In-Progress, Completed, Cancelled), date filters, and conflict detection.
4. **Doctor Directory**: Doctor profiles, specializations, licenses, working days/hours, consultation fees, and caseload statistics.
5. **Treatments Catalog**: Categorized procedures (Preventive, Restorative, Cosmetic, Endodontic, Surgery, Implantology, Orthodontics), duration, and pricing.
6. **Billing & Invoices**: Multi-item invoice generator, tax rate, discount, auto-calculation, printable invoice views, status tracking (Pending, Partial, Paid, Overdue).
7. **Payments & Receipts**: Multi-method payments (Cash, Credit Card, Debit Card, Bank Transfer, Insurance), payment receipts with printable modal, automated invoice balance tracking.
8. **Clinical Reports & Analytics**: Revenue analytics by payment method, doctor caseload distribution, appointment status metrics, procedure revenue leaderboards, and custom date range filters.
9. **Authentication & Security**: Secure JWT cookies, bcrypt password hashing, and role-based access.

---

## 🚀 Quick Start & Database

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env.local`)
```env
DATABASE_URL="your-neon-postgres-connection-string"
JWT_SECRET="your-jwt-secret-string"
```

### 3. Run Database Migrations
Runs all SQL tables, indexes, triggers, and seed data directly on your Neon database:
```bash
npm run db:migrate
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3001` if port 3000 is occupied).

### 5. Log In
- **Email**: `admin@dental.com`
- **Password**: `admin123`

---

## 🛠️ Build for Production & Vercel Deployment

```bash
npm run build
npm start
```

### Vercel Deployment:
1. Push this project to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. In Vercel Project Settings > Environment Variables, add:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Click **Deploy**.
