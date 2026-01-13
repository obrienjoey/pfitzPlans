# Marathon Plan Viewer

A local-first, static web application to visualize marathon training plans.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Locally:**
    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## Adding Plans

1.  Add your YAML plan file to `public/plans/`.
2.  Update `src/config.ts` to include the new plan in the list.

## Deployment

This app is designed for GitHub Pages.
The build output in `dist/` can be deployed directly.
