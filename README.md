# PawCare 🐾

PawCare is a pet-care management web application built to help pet owners manage their pets and care routines while connecting with veterinarians. It also includes veterinarian and administrator workspaces for managing appointments, availability, users, products, and orders.

The frontend is built with **React**, **Vite**, and **JavaScript**. **Supabase** provides authentication and the PostgreSQL database. The app connects to Supabase directly through `@supabase/supabase-js`.

> **Important:** This repository contains the frontend and supporting SQL scripts. The SQL files included here are database hardening/schema-adjustment scripts; they are not a complete, from-scratch database schema. You must configure a Supabase project with the tables and relationships expected by the app before all database-backed features will work.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Get the project](#get-the-project)
- [Configure Supabase](#configure-supabase)
- [Configure environment variables](#configure-environment-variables)
- [Run locally](#run-locally)
- [Available commands](#available-commands)
- [User roles](#user-roles)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

## Features

### Pet owner workspace
- Register and sign in.
- Manage pet profiles and vaccination information.
- Find veterinarians and manage appointments, including rescheduling.
- View care reminders and notifications.
- Browse the pet shop, manage a cart, and view orders.
- Access an AI pet-care assistant interface.
- View emergency clinic information.

### Veterinarian workspace
- Manage availability and appointment slots.
- Review appointments and patient information.
- Maintain a veterinarian profile.
- Record consultation notes and prescriptions (where the database is configured for these features).

### Administrator workspace
- View and manage users and veterinarian listings.
- Manage appointments.
- Manage shop products and orders.
- Review ratings/reviews.
- Manage administrator access and user roles.

Feature availability depends on the Supabase schema, policies, and data being set up correctly. The AI assistant interface should not be treated as a substitute for professional veterinary advice.

## Technology stack

- **React 19** — user interface
- **Vite 8** — development server and production build
- **JavaScript (ES modules)**
- **Supabase** — authentication and PostgreSQL database
- **@supabase/supabase-js** — Supabase client
- **Lucide React** — icons
- **Recharts** — charts and visualizations
- **ESLint** — code linting

## Requirements

Install the following before starting:

1. **Node.js and npm.** Use a Node.js release supported by Vite 8 (Node.js `20.19+` or `22.12+` is a suitable baseline). npm is installed with Node.js.
2. **A Supabase account and project** with the database schema required by PawCare.
3. **Git** (optional, if cloning the repository).
4. A modern browser such as Chrome, Edge, or Firefox.
5. An editor such as Visual Studio Code (optional, but recommended).

Check your installations in a terminal:

```bash
node --version
npm --version
```

## Get the project

If you have cloned the repository, open a terminal in the project root — the folder containing `package.json`.

```bash
git clone <YOUR_REPOSITORY_URL>
cd pawcare
```

If you received the project as a ZIP file, extract it and open a terminal in the extracted `pawcare` folder. Do **not** run the commands from inside `src`.

## Configure Supabase

PawCare uses Supabase for sign-in and persistent application data. You need a Supabase project and its project URL and browser-safe key.

1. Open the project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (or create one).
3. In the project settings/API section, copy:
   - **Project URL**
   - **Publishable key**, or the legacy **anon/public key** if that is what your project provides.
4. Ensure the database has the tables, columns, relationships, and Row Level Security (RLS) policies used by the application. The included SQL scripts do not create every table from scratch.
5. Open **SQL Editor** in the Supabase Dashboard and review the scripts in the local `supabase/` folder before running them.

### SQL scripts included

| File | Purpose |
| --- | --- |
| `supabase/final_security_and_constraints.sql` | Adds/updates selected database safeguards and features, including veterinarian availability, notification policies, administrator management, appointment-slot constraints, and emergency clinic/review-related schema. It assumes parts of the application schema already exist. |
| `supabase/fix_product_id_schema.sql` | Adjusts `order_items.product_id` to match a text-based `products.id`. Run this only if it matches your actual schema and the existing column types/foreign key need this correction. |

**Database setup cautions:**
- Back up important data before running SQL changes.
- Inspect each script and confirm that its assumed tables/columns exist in your project.
- Run `final_security_and_constraints.sql` only after the required base tables have been created. It references existing tables such as `profiles`, `veterinarians`, `prescriptions`, `appointments`, `notifications`, `products`, `orders`, and `order_items`.
- Run `fix_product_id_schema.sql` only if your `products.id` is text-based and `order_items.product_id` needs to be changed to match it.
- Confirm RLS is enabled and policies restrict users to the records they are permitted to access.
- If you do not already have the base schema, you will need to create/import the appropriate schema before these scripts can be applied. Do not assume that running the included scripts alone completes the database setup.

## Configure environment variables

At the project root, create a file named `.env`. You can copy `.env.example` and fill in the values.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Put your Supabase details in `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use the exact variable names shown above. Vite exposes variables prefixed with `VITE_` to browser-side code, so these values are available in the client bundle. Use only a **publishable key** or legacy **anon/public key** here.

**Never put a Supabase `service_role` key, secret API key, database password, or other server-side secret in this file.** If a secret has already been committed or shared, rotate it in Supabase.

Restart the Vite development server after changing `.env` values.

## Run locally

From the project root:

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Vite prints a local URL in the terminal, commonly:

   ```text
   http://localhost:5173
   ```

4. Open the URL in your browser.

Keep the terminal running while using the development server. Press `Ctrl+C` in the terminal to stop it.

> Installing npm packages only sets up the frontend dependencies. Database-backed functionality also requires valid `.env` values and a correctly configured Supabase database, authentication setup, and RLS policies.

## Available commands

Run these from the project root:

| Command | Description |
| --- | --- |
| `npm install` | Install project dependencies |
| `npm run dev` | Start the local Vite development server |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the production build locally after building |
| `npm run lint` | Run ESLint checks |

To test a production build locally:

```bash
npm run build
npm run preview
```

## User roles

The interface includes three application roles:

- **Owner** — pet profiles, veterinarians, appointments, reminders, shop/orders, AI assistant, and emergency information.
- **Vet** — availability, appointments, patients, and veterinarian profile.
- **Admin** — user and veterinarian management, appointments, products/orders, reviews, and administrator management.

Access to role-specific screens must be enforced by database policies and trusted server/database logic, not only by hiding frontend screens. Configure and verify the role records and RLS policies in Supabase before using real user data.

## Project structure

```text
pawcare/
├── public/                   # Public static assets and icons
├── src/
│   ├── assets/               # Images and branding assets
│   ├── lib/
│   │   └── supabase.js       # Supabase client configuration
│   ├── App.jsx               # Main application UI and page routing
│   ├── App.css               # Application styles
│   ├── index.css             # Global styles
│   └── main.jsx              # React entry point
├── supabase/
│   ├── final_security_and_constraints.sql
│   └── fix_product_id_schema.sql
├── .env.example              # Required environment-variable template
├── package.json              # Dependencies and npm scripts
├── package-lock.json         # Locked dependency versions
└── vite.config.js            # Vite configuration
```

## Troubleshooting

### The app opens but data does not load
- Check that `.env` is in the same folder as `package.json`.
- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct.
- Restart `npm run dev` after changing `.env`.
- Check the browser developer console and Network tab for Supabase errors.
- Confirm the required tables, columns, relationships, and RLS policies exist in Supabase.

### Sign-in or registration fails
- Confirm email/password authentication is enabled in Supabase under **Authentication**.
- Check whether email confirmation is enabled; a new user may need to confirm their email before signing in.
- Review the error in the browser console and Supabase Authentication logs.
- Confirm the app's profile/role setup matches the database schema and policies.

### `npm` or Node.js errors occur
- Run `node --version` and `npm --version`.
- Install a Node.js version supported by the installed Vite version.
- Run `npm install` from the folder containing `package.json`.

### SQL script fails
- Read the exact error and identify the missing table, column, constraint, or permission.
- Confirm the base schema is installed and that the script is being run against the intended Supabase project.
- Do not repeatedly run schema-changing SQL without checking its effects; back up important data first.

## Security notes

- Keep `.env` out of source control. The project `.gitignore` should exclude it; verify this before pushing to a public repository.
- Only use a Supabase publishable/anon key in frontend code. Never expose service-role or secret keys.
- RLS policies are essential because the browser communicates directly with Supabase.
- Test owner, veterinarian, and administrator permissions with separate accounts before using real data.
- Do not use real or sensitive personal/pet medical data in a demo environment unless the database security and access controls have been reviewed.

## License

No license information is specified in this project. Add a license file if you intend to distribute or reuse the project publicly.
