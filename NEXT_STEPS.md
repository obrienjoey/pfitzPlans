# Next Steps: Marathon Plan Viewer

This document outlines the roadmap for future development phases of the Marathon Plan Viewer.

## Phase 2: Pace Calculations
**Objective:** Calculate and display personalized training paces based on a user's goal finish time.

*   [ ] **Create Pace Logic:**
    *   Implement VDOT or similar calculator in `src/lib/paceCalculator.ts`.
    *   Define pace zones (Recovery, General Aerobic, LT, VO2max, Marathon Pace).
*   **UI Updates:**
    *   Add "Goal Time" input to the Header/Settings.
    *   Update `DayCard` to display target paces alongside workout descriptions (e.g., "8 mi @ 8:00/mi").

## Phase 3: Plan Customization (Runtime Editing)
**Objective:** Allow users to modify the generated schedule to fit their life events.

*   [ ] **State Refactor:** Move from purely derived state to a mutable copy of the plan in Zustand/Local Storage.
*   [ ] **Features:**
    *   **Drag & Drop:** Move workouts between days.
    *   **Add/Edit Workouts:** Click a day to manually edit the title/distance.
    *   **Blackout Dates:** Mark specific dates as "Busy" and auto-shift the schedule (complex algorithm).

## Phase 4: Data Persistence & Export
**Objective:** Let users save their plans and take them elsewhere.

*   [ ] **Export to Calendar (.ics):** Generate a calendar file so users can import the plan into Google Calendar/Outlook.
*   [ ] **Print View:** Create a print-friendly CSS stylesheet for a one-page overview.

## Phase 5: Progressive Web App (PWA)
**Objective:** Make the app installable on mobile devices.

*   [ ] Add `manifest.json`.
*   [ ] Configure Service Workers for offline access.
