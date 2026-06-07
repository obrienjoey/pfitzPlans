# RacePlans

[![Build & Deploy Status](https://github.com/obrienjoey/pfitzPlans/actions/workflows/deploy.yml/badge.svg)](https://github.com/obrienjoey/pfitzPlans/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**RacePlans** is a modern, local-first, static Progressive Web App (PWA) designed to visualize and customize running training plans (such as Pfitzinger & Douglas plans) for distances ranging from 5K to the Marathon. 

By inputting a target race date and a recent race performance, the app generates a weekly training calendar populated with personalized training pace targets for each workout (LT, VO2 Max, Recovery, General Aerobic, etc.).

---

## Key Features

- **Personalized Pace Zones**: Automatically calculates training pace ranges (both imperial and metric) based on a recent race effort.
- **Dynamic Date Scheduling**: Computes concrete training dates aligned with your target race day.
- **Interactive Drag-and-Drop**: Reschedule workouts by dragging them between days to fit your life schedule (powered by `@dnd-kit`).
- **Weekly Volume Chart**: Interactive CSS bar chart visualizing weekly training mileage build-ups, tapers, and peak volume weeks.
- **Offline First**: PWA service worker support enables offline access.
- **Shareable Configurations**: All settings (selected plan, race date, race input time/distance, units) are synchronized directly in the URL query string, making your plan bookmarkable and shareable.
- **Calendar Export (.ics)**: Download your generated training schedule as an `.ics` file to easily import all workouts into Google Calendar, Apple Calendar, or Outlook.
- **Robustness**: Graceful error handling using custom React Error Boundaries.

---

## Technology Stack

- **Framework**: React 19 (TypeScript 5)
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand 5 (with localStorage persistence)
- **Date Utilities**: date-fns 4
- **Schema Validation**: AJV + JSON Schema
- **Testing**: Vitest 4 + React Testing Library

---

## Local Setup

### Prerequisites

- Node.js (v20 or newer)
- npm

### Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/obrienjoey/pfitzPlans.git
   cd pfitzPlans
   ```

2. **Install Dependencies**:
   ```bash
   cd app
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run Tests**:
   ```bash
   npm run test
   ```

5. **Run Linting**:
   ```bash
   npm run lint
   ```

---

## Adding New Training Plans

Plans are declared as static YAML configuration files under `app/public/plans/`.

1. Write a plan YAML file following the JSON Schema declared at `app/src/data/plan-schema.json`.
2. Add your plan information entry to the registry in `app/src/config.ts`:
   ```typescript
   {
       id: 'my_new_plan',
       name: 'My Custom Plan / 50-60 mi',
       type: 'Marathon',
       weeks: 12,
       path: 'plans/my_new_plan.yaml'
   }
   ```
3. Run the application locally to verify it parses and renders correctly.

---

## License

This project is licensed under the [MIT License](LICENSE).
