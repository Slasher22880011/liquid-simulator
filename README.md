# 2D Liquid Simulator

A lightweight, interactive 2D fluid simulation running directly in the browser. Built entirely with vanilla JavaScript and HTML5 Canvas.

## How It Works

- **Grid-based Fluid Solver:** Uses a velocity and density grid to simulate fluid dynamics, color diffusion, and swirling effects.
- **Particles:** Renders ~800 particles that follow the underlying fluid velocity vectors to accentuate the flow and it is pushen away the stars.
- **menu:** A collapsible side menu allows live adjustments for:
  - Brush size
  - Fluid longevity
  - brightness
  - Preset colors (Cyan, Purple, Pink, etc.)
- **Pointer & Touch Support:** Built using the Pointer Events API to ensure smooth interactions across mouse and touchscreens without accidental page scrolling on mobile devices.

