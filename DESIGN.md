# Design System & Visual Direction (DESIGN.md)

Document Control System — PT Dentelle Jaya Infinitex

## 1. Dials
* **ENERGY:** 1 (Focused, quiet, professional enterprise tool)
* **RHYTHM:** 2 (Structured grid with sticky review sidebar and single cohesive cards)
* **MOTION:** 1 (Functional transitions only, respecting `prefers-reduced-motion`)

## 2. Core Palette
* **Brand Primary:** Corporate Deep Navy `#102a4e` (used for main card banners and primary headers)
* **Accent Action:** Royal Blue `#2563eb` (primary buttons, active tabs, focus rings)
* **Neutral Surface:** White `#ffffff` / Slate-900 `#0f172a` (dark mode)
* **Border & Line:** Slate-200 `#e2e8f0` / Slate-800 `#1e293b` (dark mode)

## 3. ISO 9001:2015 4-Tier Color Mapping
Used consistently across Document Registration, Revision, Active Documents, and Quality Pyramid Widget:
* **Level 1 — Kebijakan Mutu (Policy):**
  * Light: `bg-purple-100 text-purple-800 border-purple-200`
  * Dark: `dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800`
* **Level 2 — Prosedur Operasional (SOP):**
  * Light: `bg-blue-100 text-blue-800 border-blue-200`
  * Dark: `dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800`
* **Level 3 — Instruksi Kerja (IK / WI):**
  * Light: `bg-cyan-100 text-cyan-800 border-cyan-200`
  * Dark: `dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800`
* **Level 4 — Formulir & Rekaman Mutu (Form / Record):**
  * Light: `bg-emerald-100 text-emerald-800 border-emerald-200`
  * Dark: `dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800`

## 4. Typography & Readability (WCAG AA Compliance)
* Font: Clean geometric sans-serif (Inter/system-ui).
* Monospace font reserved strictly for Document Numbers, Sequence Codes, and Version Indicators.
* Normal text contrast must strictly maintain $\ge 4.5:1$ against adjacent surfaces. `text-slate-500` or darker is required on white backgrounds (avoiding `text-slate-400` in light mode).

