# Homayoun Clinic

A modern, full-stack clinic management dashboard built with Next.js 16, MongoDB, and Tailwind CSS. Manage patients, doctors, and medicines with real-time search, inline editing, and analytics reports.

## Live Demo

https://clinic-seven-jade.vercel.app/

## Features

- **Three entity managers** — Patients, Doctors, Medicines with full CRUD operations
- **Real-time client-side search** — `startsWith`-based filtering with multi-field matching
- **Inline editing** — Edit any field directly in the card view with per-field validation
- **Responsive pagination** — Desktop and mobile layouts with ellipsis-aware page navigation
- **Duplicate prevention** — Server-side checks with business-rule support (e.g., doctors reusing a phone for a different specialization)
- **Four-layer validation** — Client, server, application logic, and Mongoose schema all share the same rules
- **Dashboard reports** — Bar and pie charts powered by Recharts with animated stat counters
- **Dark / light / system theme** — next-themes with system preference detection
- **Toast notifications** — Auto-dismissing, deduplicated, with enter/exit animations
- **Error safety** — No raw database errors reach the client; all 500s are generic and logged server-side

## Tech Stack

| Layer         | Technology                                                                 |
|---------------|----------------------------------------------------------------------------|
| Frontend      | Next.js 16 (App Router), React 19, React Compiler, Tailwind CSS 4         |
| Charts        | Recharts                                                                   |
| Icons         | Lucide React                                                               |
| Animations    | CSS transitions + react-countup                                            |
| Backend       | Next.js Route Handlers (Web `Response` API)                                |
| Database      | MongoDB via Mongoose 9                                                     |
| Build         | Turbopack                                                                  |

## Project Structure

```
src/app/
├── api/
│   ├── doctors/route.js      # GET/POST/PUT/DELETE handlers via factories
│   ├── medicines/route.js
│   └── patients/route.js
├── components/
│   ├── Accordion.jsx         # FAQ accordion
│   ├── EcgLoader.jsx         # Loading SVG
│   ├── EntityShow.jsx        # Paginated, searchable list of ShowCards
│   ├── Form.jsx              # Generic create form (driven by config)
│   ├── FormInput.jsx         # Reusable styled input
│   ├── LoadingSpinner.jsx
│   ├── SearchInput.jsx       # Search box with clear button
│   ├── ShowCard.jsx          # Display + inline edit + delete
│   ├── Tooltip.jsx           # CSS-only tooltip
│   ├── Toast.jsx             # Single toast notification
│   ├── ToastProvider.jsx     # Toast queue via Context
│   ├── layout/
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   ├── NavbarDropdown.jsx
│   │   ├── NavbarItem.jsx
│   │   ├── SubmenuItem.jsx
│   │   └── MobileMenu/
│   │       ├── MobileNavbar.jsx
│   │       └── MobileNavbarItem.jsx
│   ├── Reports/
│   │   ├── DiseaseBarChart.jsx
│   │   ├── SpecializationPieChart.jsx
│   │   └── StatsCard.jsx
│   └── theme/
│       ├── ThemeProvider.jsx
│       └── ThemeToggle.jsx
├── lib/
│   ├── api.js               # Client fetch helpers + server handler factories
│   ├── empty-stub.js        # Turbopack alias target (excludes Mongoose from client)
│   ├── entityConfig.js      # Centralized entity configuration
│   ├── mongodb.js           # Singleton Mongoose connection
│   ├── reportUtils.js       # Chart data transformers
│   ├── useEntities.js       # Data-fetching hook
│   ├── useSearch.js         # Memoized client-side search hook
│   └── validation.js        # Shared client/server validation rules
├── models/
│   ├── Doctor.js
│   ├── Medicine.js
│   └── Patient.js
├── (entities)/
│   ├── doctors/page.jsx        # Create form
│   ├── doctors/show/page.jsx   # List + edit view
│   ├── medicines/page.jsx
│   ├── medicines/show/page.jsx
│   ├── patients/page.jsx
│   └── patients/show/page.jsx
├── reports/page.jsx          # Dashboard with charts and stats
├── globals.css
├── layout.js                 # Root layout with Theme + Toast providers
├── loading.js                # Global loading fallback (ECG animation)
└── page.js                   # Home page with vision + FAQ
```

## Installation

### Prerequisites

- Node.js 20+
- MongoDB (local instance or Atlas cluster)

### Setup

```bash
git clone https://github.com/Homayoun-Naji/Clinic.git
cd clinic
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/clinic
# or for Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/clinic
```

## Running the Project

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script       | Description                              |
|--------------|------------------------------------------|
| `npm run dev`  | Start the development server with Turbopack |
| `npm run build` | Production build (lint + optimize)       |
| `npm run start` | Start the production server             |
| `npm run lint`  | Run ESLint                              |

## API Overview

All endpoints follow REST conventions with JSON request/response bodies.

### Doctor

| Method   | Path           | Body                                | Returns          |
|----------|----------------|-------------------------------------|------------------|
| GET      | `/api/doctors` | —                                   | `Doctor[]`       |
| POST     | `/api/doctors` | `{ first_name, last_name, specialization, phone?, email? }` | `Doctor` (201) |
| PUT      | `/api/doctors` | `{ _id, ...fields }`                | `Doctor` (200)   |
| DELETE   | `/api/doctors` | `{ _id }`                           | `{ message }`    |

**Special rule:** A doctor's phone number may be reused if the same person registers with a different specialization. Different people sharing a phone number is rejected with HTTP 409.

### Medicine

| Method   | Path             | Body                              | Returns          |
|----------|------------------|-----------------------------------|------------------|
| GET      | `/api/medicines` | —                                 | `Medicine[]`     |
| POST     | `/api/medicines` | `{ name, description, price, stock? }` | `Medicine` (201) |
| PUT      | `/api/medicines` | `{ _id, ...fields }`              | `Medicine` (200) |
| DELETE   | `/api/medicines` | `{ _id }`                         | `{ message }`    |

### Patient

| Method   | Path            | Body                                        | Returns          |
|----------|-----------------|---------------------------------------------|------------------|
| GET      | `/api/patients` | —                                           | `Patient[]`      |
| POST     | `/api/patients` | `{ first_name, last_name, birth_date, disease }` | `Patient` (201) |
| PUT      | `/api/patients` | `{ _id, ...fields }`                        | `Patient` (200)  |
| DELETE   | `/api/patients` | `{ _id }`                                   | `{ message }`    |

### Error Responses

Validation errors return HTTP 400 with `{ fieldErrors: { [field]: "message" } }` for inline form display. Server errors return HTTP 500 with a generic `{ error: "..." }` message — raw database internals are never exposed.

## Validation Strategy

Validation runs at four layers (defense in depth):

1. **Client-side** (`lib/validation.js` → `validateField`): Immediate UX feedback on form inputs. Entity-aware — medicine names allow numbers (`Vitamin B12`), doctor/patient names are letters-only.
2. **Server-side** (`lib/validation.js` → `normalizeAndValidate`): Every POST/PUT route handler runs this before touching the database. Normalizes whitespace and rejects invalid payloads with detailed `fieldErrors`.
3. **Application logic** (`lib/api.js`): Doctor-specific phone-reuse rules and duplicate-record checks (exact match on required fields) return HTTP 409 before `Model.create`.
4. **Database** (`models/*.js`): Mongoose schema validators (`required`, `maxlength`, regex patterns, `runValidators: true` on updates) catch anything that bypasses layers 1–3.

## Search Functionality

Search is client-side and real-time, powered by the `useSearch` hook:

- **Case-insensitive** — typing `ali` matches `Ali`
- **`startsWith` matching** — `ali` matches `Ali` but not `Mohammad Ali`
- **Multi-field full-name matching** — for doctors/patients, `ali mo` matches `Ali Mohammadi` by checking against the concatenated `first_name + " " + last_name`
- **Memoized** — only recomputes when data, search term, or keys change

## Architecture

The application follows a **configuration-driven** design. Entity metadata (API paths, field mappings, required fields, display titles) lives in a single `ENTITY_CONFIG` object in `lib/entityConfig.js`. Components like `Form`, `EntityShow`, and `ShowCard` are generic and render based on props passed from the entity-specific pages. Adding a new entity requires only a config entry, a route handler, and two pages — no new component logic.

API route handlers are generated by factory functions in `lib/api.js` (`createGetHandler`, `createPostHandler`, `createPutHandler`, `createDeleteHandler`). This eliminates boilerplate and ensures consistent error handling, duplicate detection, and validation across all entities.

The same `lib/api.js` module is imported by both client components (for fetch helpers) and server route handlers (for handler factories). A Turbopack `resolveAlias` in `next.config.mjs` swaps `@/app/lib/mongodb` with an empty stub in the browser bundle, preventing Mongoose and its Node.js builtins from entering the client bundle.

## Screenshots

![Home page screenshot](public/demo.gif)
*Add screenshots of the dashboard, entity forms, and reports views here.*

## Future Improvements

- **Server-side pagination** — `EntityShow` currently loads all records client-side; suitable for small datasets only.
- **Global error boundary** — Catch and display render-time errors gracefully.
- **Optimistic updates** — Update the UI immediately on edit/delete, rollback on failure.
- **Tests** — Add unit tests for utilities and integration tests for API routes.
- **TypeScript** — Add static typing across the codebase for safer refactors.
- **MongoDB indexes** — Add indexes on fields used in duplicate-detection queries for write-heavy workloads.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/xyz`)
3. Make your changes
4. Run `npm run lint` and `npm run build` to verify
5. Open a pull request

See [Explanations.md](./Explanations.md) for detailed implementation notes.

## License

This project is provided as-is for educational and internal use.
