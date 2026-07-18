# WingGuard Project Guidelines & Rules

Welcome! This document outlines coding standards, structural requirements, and style rules for the **WingGuard** workspace. Follow these guidelines to maintain a clean, performant, and secure platform.

---

## 1. Data Layer Abstraction (`DataAdapter`)
- **Strict Separation**: ALL UI views, triggers, and elements must read or write data exclusively through the `DataAdapter` abstraction layer defined in `src/DataAdapter.js`.
- **No Direct Storage/Database Access**: Never import `@supabase/supabase-js` or access `localStorage` directly within any HTML files or page-level JavaScript files (e.g., `src/main.js` or inline script tags).
- **Mock Integrity**: The codebase must support complete local mock mode (using browser `localStorage` as fallback) when `FORCE_LOCAL_MOCK` is enabled in `src/env.js` or when Supabase keys are not present. Ensure any new methods implemented in `DataAdapter` support both real Supabase queries and offline local operations.

---

## 2. Aesthetics & Styling Design
- **Core Dashboard & Actions (`index.html`)**: Style components using Tailwind CSS utility classes and design tokens defined in `tailwind.config.js`. Import `src/style.css` at the top of the bundle.
- **Narrative & Storytelling Pages (`home.html`, `story.html`, `birds.html`, `protect.html`, `about.html`, `identify.html`)**: Emphasize curated typography (using the `Fraunces`, `Manrope`, and `Noto Serif SC` font families) and custom-tuned spacing classes declared in `src/narrative.css`.
- **Consistency**: Keep the layout colors, hover effects, and cards aligned to the modern, high-quality, premium green-earth/ecological visual aesthetic of the project.

---

## 3. Database Schema Control
- **Database Initialization Order**:
  1. `supabase_schema.sql`: Sets up the base user `profiles` table, row-level security (RLS), triggers to automate user creation synchronizing with Supabase Auth, and safety checks on user roles.
  2. `supabase_schema_v2.sql`: Extends the schema with the business entities `species` (seed data included), `observations` (user reports), and `reports` (emergency flags), complete with respective RLS policies.
- **Schema Updates**: When introducing database schema enhancements, update both the SQL scripts and ensure matching mock data fallbacks in `src/DataAdapter.js`.

---

## 4. Multi-Page Routing & Bundling
- **Vite Integration**: This repository uses Vite as its development server and bundler.
- **Rollup Input Registry**: When creating a new page (e.g., `new-feature.html`), you must register its entry point under `build.rollupOptions.input` in `vite.config.js` to ensure it compiles correctly during the build phase.
