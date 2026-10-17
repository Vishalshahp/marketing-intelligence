# Project Hezal: Marketing Intelligence Platform

> **Master Specification v2.0.0** — High-precision analytical engine engineered for multi-channel ad performance (Meta, Google, LinkedIn) with deterministic KPI boundary proofs, CSV formula injection defense, and evidence-linked 5-tuple recommendations.

---

## 🏛️ Architecture Highlights

- **Read-Only Intelligence First:** Diagnoses ad spend, detects fatigue, and prescribes controlled experiments without altering live ad account states directly.
- **CSV Injection Defense:** Sanitizes all string inputs against dangerous spreadsheet formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) prior to storage and export.
- **Deterministic KPI Boundary Math:** Strict division-by-zero guards on CTR, CPC, and CPA. Crucially, missing revenue is marked as untracked (`is_revenue_tracked: false`) rather than `$0`, eliminating artificial ROAS distortion.
- **5-Tuple Heuristic Rule Engine:** Standardized diagnostic cards: `Observation` → `Evidence` → `Interpretation` → `Action to Consider` → `Limitation`.
- **Customer Segmentation (RFM K-Means):** Groups customer cohorts across Recency, Frequency, and Monetary spend with mandatory algorithmic disclosure caveats.
- **Multi-Tenant IDOR Isolation:** Every database query is strictly scoped to the active tenant workspace.

---

## 💻 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend:** Node.js, Express (ES Modules), Mongoose, Multer, PapaParse
- **Database:** MongoDB
- **Testing:** Native Node.js test runner (`node:test`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally on port `27017`

### 2. Installation
Install dependencies for both client and server:
```bash
npm run install:all
```

### 3. Running Locally
Start both backend and frontend servers:

**Terminal 1 (Backend API on Port 5000):**
```bash
npm run dev:server
```

**Terminal 2 (Frontend Client on Port 5173):**
```bash
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing
Run the deterministic KPI math assertions and formula injection security test suite:
```bash
npm test
```

---

## 📊 Design Tokens (Strict Section 05 Adherence)
- `--color-navy`: `#14243A`
- `--color-blue`: `#356AE6`
- `--color-teal`: `#16B8A6`
- `--color-canvas`: `#F5F7FB`
- `--color-surface`: `#FFFFFF`
- `--color-border`: `#E2E8F0`
- `--color-text`: `#182230`
- `--color-muted`: `#667085`
- `--color-success`: `#16804A`
- `--color-warning`: `#9A5B00`
- `--color-error`: `#B42318`
