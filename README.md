# Interactive Fluid Simulation

A browser-based interactive 2D fluid simulation built with HTML5 Canvas and Vanilla JavaScript. The project combines real-time fluid dynamics with an aesthetic, customizable user interface.

## Features

- **Fluid Dynamics & Particle Engine:** Implements grid-based Navier–Stokes solvers (diffusion, advection, and projection) alongside ~800 background particles that move with the velocity field.
- **Interactive Sidebar Menu:** Expandable settings panel with a frosted-glass look (backdrop-filter: blur(15px)) and smooth slide-in transition.
- **Real-Time Customization Controls:**
  - **Width:** Adjusts the stroke radius of the fluid source.
  - **Duration:** Modifies the dissipation rate to control how long the fluid remains on screen.
  - **Brightness:** Scales the intensity multiplier of the rendered colors.
  - **Color Theme:** Dropdown to switch between Cyan, Purple, Green, Orange, Pink, and White.
- **Cross-Platform Input Support:** Uses pointer events to handle mouse and touch inputs, paired with touch-action styles to prevent unintended page scrolling on mobile devices.

## Tech Stack

- **HTML5:** Structure containing a canvas element, toggle button, and structured sidebar control groups.
- **CSS3:** Advanced styling featuring fixed layouts, hardware-accelerated blur effects, custom range inputs, and styled dropdown menus.
- **JavaScript (Vanilla):** Handles grid allocation, particle classes, physics loops, color mapping, and UI event binding.

