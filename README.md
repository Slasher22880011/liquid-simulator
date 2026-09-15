# Interactive Fluid Simulation

A lightweight, real-time 2D fluid dynamics sandbox running directly in the browser. Powered by Eulerian fluid mechanics and Navier-Stokes equations for incompressible flow, this project simulates realistic fluid movement, velocity fields, pressure projection, advection, and diffusion—all without external libraries or frameworks.

---

## 🚀 Features

* **Physics-Based Presets**
  * **Water:** Fast-flowing with low viscosity and low damping.
  * **Honey:** High viscosity, high damping, and slow dissipation.
  * **Oil:** Smooth, slick movement with balanced viscosity.
  * **Gas / Smoke:** Low viscosity with upward buoyancy effects.

* **Interactive Tools & Objects**
  * **Fluid Paint:** Draw fluid streams directly onto the canvas with adjustable brush sizes.
  * **Emitters (Sources):** Place continuous fluid sources with interactive drag-to-aim direction controls.
  * **Sinks (Drains):** Place drains that actively pull in fluid and reduce surrounding velocity.
  * **Vortices:** Place rotating anchors that swirl surrounding fluid into whirlpools.
  * **Eraser:** Remove specific placed objects from the canvas.

* **Customization & Visuals**
  * Live controls for fluid lifespan (dissipation), brightness, brush radius, and angle.
  * Customizable color schemes (Cyan, Purple, Green, Orange, Pink, White, or Preset-default).
  * Background particle system to visualize underlying velocity vectors.

---

## 🛠️ Tech Stack

* **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Rendering:** Dual-Canvas setup (Main Canvas for UI/Particles, Offscreen `ImageData` buffer for 60 FPS pixel manipulation)
* **Solver:** Iterative Gauss-Seidel linear solver for pressure projection and boundary conditioning

---

## 💻 Getting Started

No installation or build steps are required.
just open https://slasher22880011.github.io/liquid-simulator/ in your browser 
