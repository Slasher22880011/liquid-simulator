const FLUID_PRESETS = {
    water: {
        viscosity: 0.00005,
        damping: 0.990,
        dissipation: 0.985,
        buoyancy: 0.0,
        color: [0, 220, 255]
    },
    honey: {
        viscosity: 0.008,
        damping: 0.860,
        dissipation: 0.995,
        buoyancy: 0.015,
        color: [255, 180, 20]
    },
    oil: {
        viscosity: 0.0015,
        damping: 0.975,
        dissipation: 0.990,
        buoyancy: 0.0,
        color: [180, 255, 40]
    },
    gas: {
        viscosity: 0.0001,
        damping: 0.982,
        dissipation: 0.940,
        buoyancy: -0.04,
        color: [210, 215, 230]
    }
};

const COLOR_PALETTE = {
    cyan: [0, 220, 255],
    purple: [190, 90, 255],
    green: [70, 255, 130],
    orange: [255, 150, 40],
    pink: [255, 80, 170],
    white: [255, 255, 255]
};

let currentPresetKey = 'water';
let currentPreset = { ...FLUID_PRESETS.water };
let activeTool = 'draw';

const config = {
    radius: 3,
    dissipation: currentPreset.dissipation,
    brightness: 1.0,
    customColor: 'preset'
};

let placedObjects = [];
let placingEmitter = null;

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const toolSelect = document.getElementById('toolSelect');
const clearObjectsBtn = document.getElementById('clearObjectsBtn');
const fluidTypeSelect = document.getElementById('fluidTypeSelect');
const radiusSlider = document.getElementById('sliderRadius');
const dissipationSlider = document.getElementById('sliderDissipation');
const brightnessSlider = document.getElementById('sliderBrightness');
const colorSelect = document.getElementById('colorSelect');

const radiusValue = document.getElementById('valRadius');
const dissipationValue = document.getElementById('valDissipation');
const brightnessValue = document.getElementById('valBrightness');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    menuToggle.classList.toggle('shifted');
    menuToggle.innerText = sidebar.classList.contains('open') ? '✕ Close' : '☰ Menu';
});

toolSelect.addEventListener('change', (e) => {
    activeTool = e.target.value;
});

clearObjectsBtn.addEventListener('click', () => {
    placedObjects = [];
});

fluidTypeSelect.addEventListener('change', (e) => {
    currentPresetKey = e.target.value;
    const basePreset = FLUID_PRESETS[currentPresetKey];
    currentPreset = { ...basePreset };

    config.dissipation = basePreset.dissipation;
    dissipationSlider.value = basePreset.dissipation;
    dissipationValue.innerText = (basePreset.dissipation * 100).toFixed(1) + '%';
});

radiusSlider.addEventListener('input', (e) => {
    config.radius = parseInt(e.target.value, 10);
    radiusValue.innerText = config.radius;
});

dissipationSlider.addEventListener('input', (e) => {
    config.dissipation = parseFloat(e.target.value);
    dissipationValue.innerText = (config.dissipation * 100).toFixed(1) + '%';
});

brightnessSlider.addEventListener('input', (e) => {
    config.brightness = parseFloat(e.target.value);
    brightnessValue.innerText = config.brightness.toFixed(1);
});

colorSelect.addEventListener('change', (e) => {
    config.customColor = e.target.value;
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');
let imgData;

let width, height;
let cols, rows;
const resolution = 8;

let u, v, uPrev, vPrev;
let density, densityPrev;
let p, div;

let isDrawing = false;
let mouseX = 0, mouseY = 0;
let prevMouseX = 0, prevMouseY = 0;

let particles = [];
const numParticles = 800;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.floor(width / resolution);
    rows = Math.floor(height / resolution);

    offscreenCanvas.width = cols;
    offscreenCanvas.height = rows;
    imgData = offscreenCtx.createImageData(cols, rows);

    initGrids();
    initParticles();
}

function initGrids() {
    u = Array(cols).fill().map(() => Array(rows).fill(0));
    v = Array(cols).fill().map(() => Array(rows).fill(0));
    uPrev = Array(cols).fill().map(() => Array(rows).fill(0));
    vPrev = Array(cols).fill().map(() => Array(rows).fill(0));
    density = Array(cols).fill().map(() => Array(rows).fill(0));
    densityPrev = Array(cols).fill().map(() => Array(rows).fill(0));
    p = Array(cols).fill().map(() => Array(rows).fill(0));
    div = Array(cols).fill().map(() => Array(rows).fill(0));
}

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
        const c = Math.floor(this.x / resolution);
        const r = Math.floor(this.y / resolution);

        if (c >= 0 && c < cols && r >= 0 && r < rows) {
            this.vx = u[c][r] * resolution * 1.2;
            this.vy = v[c][r] * resolution * 1.2;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function setBnd(b, x) {
    for (let i = 1; i < cols - 1; i++) {
        x[i][0] = b === 2 ? -x[i][1] : x[i][1];
        x[i][rows - 1] = b === 2 ? -x[i][rows - 2] : x[i][rows - 2];
    }
    for (let j = 1; j < rows - 1; j++) {
        x[0][j] = b === 1 ? -x[1][j] : x[1][j];
        x[cols - 1][j] = b === 1 ? -x[cols - 2][j] : x[cols - 2][j];
    }
    x[0][0] = 0.5 * (x[1][0] + x[0][1]);
    x[cols - 1][0] = 0.5 * (x[cols - 2][0] + x[cols - 1][1]);
    x[0][rows - 1] = 0.5 * (x[1][rows - 1] + x[0][rows - 2]);
    x[cols - 1][rows - 1] = 0.5 * (x[cols - 2][rows - 1] + x[cols - 1][rows - 2]);
}

function linSolve(b, x, x0, a, c) {
    const cRecip = 1.0 / c;
    for (let k = 0; k < 20; k++) {
        for (let i = 1; i < cols - 1; i++) {
            for (let j = 1; j < rows - 1; j++) {
                x[i][j] = (x0[i][j] + a * (x[i + 1][j] + x[i - 1][j] + x[i][j + 1] + x[i][j - 1])) * cRecip;
            }
        }
        setBnd(b, x);
    }
}

function diffuse(b, x, x0, diff, dt) {
    const a = dt * diff * (cols - 2) * (rows - 2);
    linSolve(b, x, x0, a, 1 + 4 * a);
}

function advect(b, d, d0, u, v, dt) {
    const dt0 = dt * (cols - 2);
    const dt1 = dt * (rows - 2);
    for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
            let x = i - dt0 * u[i][j];
            let y = j - dt1 * v[i][j];
            if (x < 0.5) x = 0.5;
            if (x > cols - 1.5) x = cols - 1.5;
            const i0 = Math.floor(x);
            const i1 = i0 + 1;
            if (y < 0.5) y = 0.5;
            if (y > rows - 1.5) y = rows - 1.5;
            const j0 = Math.floor(y);
            const j1 = j0 + 1;
            const s1 = x - i0;
            const s0 = 1 - s1;
            const t1 = y - j0;
            const t0 = 1 - t1;
            d[i][j] = s0 * (t0 * d0[i0][j0] + t1 * d0[i0][j1]) + s1 * (t0 * d0[i1][j0] + t1 * d0[i1][j1]);
        }
    }
    setBnd(b, d);
}

function project(u, v, p, div) {
    const hx = 1.0 / cols;
    const hy = 1.0 / rows;
    for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
            div[i][j] = -0.5 * hx * (u[i + 1][j] - u[i - 1][j] + v[i][j + 1] - v[i][j - 1]);
            p[i][j] = 0;
        }
    }
    setBnd(0, div);
    setBnd(0, p);
    linSolve(0, p, div, 1, 4);

    for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
            u[i][j] -= 0.5 * (p[i + 1][j] - p[i - 1][j]) / hx;
            v[i][j] -= 0.5 * (p[i][j + 1] - p[i][j - 1]) / hy;
        }
    }
    setBnd(1, u);
    setBnd(2, v);
}

function processPlacedObjects() {
    for (let i = 0; i < placedObjects.length; i++) {
        const obj = placedObjects[i];
        const centerC = Math.floor(obj.x / resolution);
        const centerR = Math.floor(obj.y / resolution);

        if (obj.type === 'emitter') {
            const radius = Math.floor(config.radius);
            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    const c = centerC + x;
                    const r = centerR + y;
                    if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
                        const dist = Math.hypot(x, y);
                        if (dist <= radius) {
                            const factor = 1 - (dist / radius);
                            density[c][r] = Math.min(255, density[c][r] + 120 * factor);
                            u[c][r] += Math.cos(obj.angle) * 0.4 * factor;
                            v[c][r] += Math.sin(obj.angle) * 0.4 * factor;
                        }
                    }
                }
            }
        } else if (obj.type === 'sink') {
            const radius = Math.floor(config.radius * 2.5);
            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    const c = centerC + x;
                    const r = centerR + y;
                    if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
                        const dist = Math.hypot(x, y);
                        if (dist <= radius) {
                            const factor = 1 - (dist / radius);
                            density[c][r] *= (1 - 0.25 * factor);
                            u[c][r] *= (1 - 0.25 * factor);
                            v[c][r] *= (1 - 0.25 * factor);
                        }
                    }
                }
            }
        } else if (obj.type === 'vortex') {
            const radius = Math.floor(config.radius * 3.5);
            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    const c = centerC + x;
                    const r = centerR + y;
                    if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
                        const dist = Math.hypot(x, y);
                        if (dist > 0 && dist <= radius) {
                            const factor = (1 - (dist / radius)) * 0.12;
                            const tangentX = -y;
                            const tangentY = x;
                            u[c][r] += tangentX * factor;
                            v[c][r] += tangentY * factor;
                        }
                    }
                }
            }
        }
    }
}

function update() {
    const dt = 0.1;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            uPrev[i][j] = 0;
            vPrev[i][j] = 0;
            densityPrev[i][j] = 0;
        }
    }

    processPlacedObjects();

    if (currentPreset.buoyancy !== 0) {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (density[i][j] > 1) {
                    v[i][j] += currentPreset.buoyancy * (density[i][j] / 255);
                }
            }
        }
    }

    if (isDrawing && activeTool === 'draw') {
        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / (resolution * 0.5)));

        const maxV = 2.0;
        let speed = dist * 0.05;
        if (speed > maxV) speed = maxV;

        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;
        const vx = dirX * speed;
        const vy = dirY * speed;

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const cx = prevMouseX + dx * t;
            const cy = prevMouseY + dy * t;

            const col = Math.floor(cx / resolution);
            const row = Math.floor(cy / resolution);
            const radius = Math.floor(config.radius);

            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    const d = Math.hypot(x, y);
                    if (d <= radius) {
                        const c = col + x;
                        const r = row + y;
                        if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
                            const factor = 1 - (d / radius);
                            const newDensity = 255 * factor;

                            if (newDensity > densityPrev[c][r]) {
                                densityPrev[c][r] = newDensity;
                                uPrev[c][r] = vx * factor;
                                vPrev[c][r] = vy * factor;
                            }
                        }
                    }
                }
            }
        }
    }

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            u[i][j] += uPrev[i][j];
            v[i][j] += vPrev[i][j];
            density[i][j] += densityPrev[i][j];
        }
    }

    let tempU = uPrev; uPrev = u; u = tempU;
    diffuse(1, u, uPrev, currentPreset.viscosity, dt);
    let tempV = vPrev; vPrev = v; v = tempV;
    diffuse(2, v, vPrev, currentPreset.viscosity, dt);

    project(u, v, p, div);

    let tempU2 = uPrev; uPrev = u; u = tempU2;
    let tempV2 = vPrev; vPrev = v; v = tempV2;
    advect(1, u, uPrev, uPrev, vPrev, dt);
    advect(2, v, vPrev, uPrev, vPrev, dt);

    project(u, v, p, div);

    let tempD = densityPrev; densityPrev = density; density = tempD;
    diffuse(0, density, densityPrev, 0.00005, dt);
    let tempD2 = densityPrev; densityPrev = density; density = tempD2;
    advect(0, density, densityPrev, u, v, dt);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            density[i][j] *= config.dissipation;
            u[i][j] *= currentPreset.damping;
            v[i][j] *= currentPreset.damping;
        }
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;
}

function drawPlacedObjects() {
    const now = Date.now() * 0.003;

    for (let i = 0; i < placedObjects.length; i++) {
        const obj = placedObjects[i];

        ctx.save();
        ctx.translate(obj.x, obj.y);

        if (obj.type === 'emitter') {
            ctx.strokeStyle = '#4eec78';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#4eec78';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.rotate(obj.angle);
            ctx.beginPath();
            ctx.moveTo(14, 0);
            ctx.lineTo(24, 0);
            ctx.lineTo(20, -5);
            ctx.moveTo(24, 0);
            ctx.lineTo(20, 5);
            ctx.stroke();
        } else if (obj.type === 'sink') {
            ctx.strokeStyle = '#ff4d4d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(10, 10);
            ctx.moveTo(10, -10);
            ctx.lineTo(-10, 10);
            ctx.stroke();
        } else if (obj.type === 'vortex') {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.rotate(now);

            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 1.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, 8, Math.PI, Math.PI * 2.5);
            ctx.stroke();
        }

        ctx.restore();
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    const data = imgData.data;
    const activeColor = config.customColor === 'preset' 
        ? currentPreset.color 
        : COLOR_PALETTE[config.customColor];

    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const idx = (j * cols + i) * 4;
            const val = density[i][j];
            if (val > 0.5) {
                const intensity = (val / 255) * config.brightness;
                data[idx]     = Math.floor(Math.min(255, activeColor[0] * intensity));
                data[idx + 1] = Math.floor(Math.min(255, activeColor[1] * intensity));
                data[idx + 2] = Math.floor(Math.min(255, activeColor[2] * intensity));
                data[idx + 3] = Math.min(255, Math.floor(val * 1.5));
            } else {
                data[idx + 3] = 0;
            }
        }
    }
    offscreenCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreenCanvas, 0, 0, width, height);

    drawPlacedObjects();
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

function handleObjectPlacement(x, y) {
    if (activeTool === 'eraser') {
        placedObjects = placedObjects.filter(obj => Math.hypot(obj.x - x, obj.y - y) > 25);
        return;
    }

    if (activeTool === 'emitter') {
        placedObjects = placedObjects.filter(obj => Math.hypot(obj.x - x, obj.y - y) > 10);

        const newEmitter = {
            type: 'emitter',
            x: x,
            y: y,
            angle: 0
        };
        placedObjects.push(newEmitter);
        placingEmitter = newEmitter;
    } else if (activeTool === 'sink') {
        placedObjects.push({ type: 'sink', x: x, y: y });
    } else if (activeTool === 'vortex') {
        placedObjects.push({ type: 'vortex', x: x, y: y });
    }
}

window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#sidebar') || e.target.closest('#menuToggle')) return;

    mouseX = e.clientX;
    mouseY = e.clientY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    if (activeTool === 'draw') {
        isDrawing = true;
    } else {
        handleObjectPlacement(mouseX, mouseY);
    }
});

window.addEventListener('pointerup', () => {
    isDrawing = false;
    placingEmitter = null;
});

window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (placingEmitter) {
        const dx = mouseX - placingEmitter.x;
        const dy = mouseY - placingEmitter.y;

        if (Math.hypot(dx, dy) > 5) {
            let angle = Math.atan2(dy, dx);
            if (angle < 0) angle += Math.PI * 2;

            placingEmitter.angle = angle;

        }
    }
});

window.addEventListener('resize', resize);

resize();
animate();