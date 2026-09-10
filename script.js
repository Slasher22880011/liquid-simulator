    const config = {
            radius: 3,
            dissipation: 0.975,
            brightness: 1.0,
            color: 'cyan'
        };

        const colors = {
            cyan: [0, 220, 255],
            purple: [190, 90, 255],
            green: [70, 255, 130],
            orange: [255, 150, 40],
            pink: [255, 80, 170],
            white: [255, 255, 255]
        };

        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menuToggle');
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
            menuToggle.innerText = sidebar.classList.contains('open') ? '✕ close' : '☰ Menu';
        });

        radiusSlider.addEventListener('input', (event) => {
            config.radius = parseInt(event.target.value, 10);
            radiusValue.innerText = config.radius;
        });

        dissipationSlider.addEventListener('input', (event) => {
            config.dissipation = parseFloat(event.target.value);
            dissipationValue.innerText = (config.dissipation * 100).toFixed(1) + '%';
        });

        brightnessSlider.addEventListener('input', (event) => {
            config.brightness = parseFloat(event.target.value);
            brightnessValue.innerText = config.brightness.toFixed(1);
        });

        colorSelect.addEventListener('change', (event) => {
            config.color = event.target.value;
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
        let mouseX = 0;
        let mouseY = 0;
        let prevMouseX = 0;
        let prevMouseY = 0;

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
                const column = Math.floor(this.x / resolution);
                const row = Math.floor(this.y / resolution);

                if (column >= 0 && column < cols && row >= 0 && row < rows) {
                    this.vx = u[column][row] * resolution * 1.2;
                    this.vy = v[column][row] * resolution * 1.2;
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
            let cRecip = 1.0 / c;
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
            let a = dt * diff * (cols - 2) * (rows - 2);
            linSolve(b, x, x0, a, 1 + 4 * a);
        }

        function advect(b, d, d0, u, v, dt) {
            let dt0 = dt * (cols - 2);
            let dt1 = dt * (rows - 2);
            for (let i = 1; i < cols - 1; i++) {
                for (let j = 1; j < rows - 1; j++) {
                    let x = i - dt0 * u[i][j];
                    let y = j - dt1 * v[i][j];
                    if (x < 0.5) x = 0.5;
                    if (x > cols - 1.5) x = cols - 1.5;
                    let i0 = Math.floor(x);
                    let i1 = i0 + 1;
                    if (y < 0.5) y = 0.5;
                    if (y > rows - 1.5) y = rows - 1.5;
                    let j0 = Math.floor(y);
                    let j1 = j0 + 1;
                    let s1 = x - i0;
                    let s0 = 1 - s1;
                    let t1 = y - j0;
                    let t0 = 1 - t1;
                    d[i][j] = s0 * (t0 * d0[i0][j0] + t1 * d0[i0][j1]) + s1 * (t0 * d0[i1][j0] + t1 * d0[i1][j1]);
                }
            }
            setBnd(b, d);
        }

        function project(u, v, p, div) {
            let hx = 1.0 / cols;
            let hy = 1.0 / rows;
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

        function update() {
            let dt = 0.1;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    uPrev[i][j] = 0;
                    vPrev[i][j] = 0;
                    densityPrev[i][j] = 0;
                }
            }

            if (isDrawing) {
                let dx = mouseX - prevMouseX;
                let dy = mouseY - prevMouseY;
                let dist = Math.hypot(dx, dy);

                let steps = Math.max(1, Math.ceil(dist / (resolution * 0.5)));

                let maxV = 2.0; 
                let speed = dist * 0.05; 
                if (speed > maxV) speed = maxV;

                let dirX = dist > 0 ? dx / dist : 0;
                let dirY = dist > 0 ? dy / dist : 0;

                let vx = dirX * speed;
                let vy = dirY * speed;

                for (let i = 0; i <= steps; i++) {
                    let t = steps === 0 ? 0 : i / steps;
                    let cx = prevMouseX + dx * t;
                    let cy = prevMouseY + dy * t;

                    let col = Math.floor(cx / resolution);
                    let row = Math.floor(cy / resolution);
                    let radius = config.radius;

                    for (let x = -radius; x <= radius; x++) {
                        for (let y = -radius; y <= radius; y++) {
                            let d = Math.hypot(x, y);
                            if (d <= radius) {
                                let c = col + x;
                                let r = row + y;
                                if (c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
                                    let factor = 1 - (d / radius);
                                    let newDensity = 255 * factor;
                                    
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
            diffuse(1, u, uPrev, 0.0001, dt);
            let tempV = vPrev; vPrev = v; v = tempV;
            diffuse(2, v, vPrev, 0.0001, dt);

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
                    u[i][j] *= 0.985;
                    v[i][j] *= 0.985;
                }
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }

            prevMouseX = mouseX;
            prevMouseY = mouseY;
        }

        function draw() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].draw();
            }

            let data = imgData.data;
            for (let j = 0; j < rows; j++) {
                for (let i = 0; i < cols; i++) {
                    let idx = (j * cols + i) * 4;
                    let val = density[i][j];
                    if (val > 0.5) {
                        let color = colors[config.color];
                        let intensity = val / 255 * config.brightness;
                        data[idx]     = Math.floor(Math.min(255, color[0] * intensity));
                        data[idx + 1] = Math.floor(Math.min(255, color[1] * intensity));
                        data[idx + 2] = Math.floor(Math.min(255, color[2] * intensity));
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
        }

        function animate() {
            update();
            draw();
            requestAnimationFrame(animate);
        }

        window.addEventListener('pointerdown', (e) => {
            if (e.target.closest('#sidebar') || e.target.closest('#menuToggle')) return;
            
            isDrawing = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
            prevMouseX = mouseX;
            prevMouseY = mouseY;
        });

        window.addEventListener('pointerup', () => {
            isDrawing = false;
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDrawing) return;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        window.addEventListener('resize', resize);

        resize();
        animate();