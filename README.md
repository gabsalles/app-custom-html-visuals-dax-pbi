# DAX HTML Card Generator for Power BI

An interactive WYSIWYG visual builder (built with React) for creating advanced HTML/CSS visuals in Power BI.

This project lets you design modern KPI cards and donut charts (with shadows, gradients, and animations) and automatically generates the DAX measure (HTML + CSS + logic) required to render the visual using the "HTML Content" custom visual in Power BI.

## Features

- **Visual WYSIWYG Editor:** Adjust colors, fonts, borders, shadows, and spacing without writing CSS.
- **Automatic DAX Generation:** The app produces the full DAX code (HTML + CSS + logic) for you.
- **Supported Components:**
  - **KPI Cards:** Icons (Lucide), progress bars, and trend indicators (MoM/YoY).
  - **Charts:** Donut Charts and Gauges (semi-circles) fully customizable via SVG.
- **Responsive Preview:** Live preview for Mobile, Tablet, and Desktop layouts.
- **Data Binding:** Use placeholders (e.g., [Total Sales]) that will be replaced by your actual measures in Power BI.
- **Themes:** Global style controls (simulated Dark/Light mode, primary colors, border radius).
- **Import/Export:** Save and load projects as JSON files.

## Technologies

- React 19 & Vite
- Tailwind CSS (UI styling for the editor)
- Lucide React (icons)
- TypeScript

## Run locally

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## How to use in Power BI

1. Design your visual in this application.
2. In the Data tab, register the names of your measures (for example: [Total Sales]).
3. Click "DAX Code" and copy the generated code.
4. In Power BI:
   - Download the "HTML Content" custom visual (by Daniel Marsh-Patrick).
   - Create a new Measure and paste the generated DAX code.
   - Drag the measure into the HTML Content visual.

---

_Developed to speed up the creation of high-fidelity dashboards._