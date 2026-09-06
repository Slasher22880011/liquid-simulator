const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let cols, rows;
const resolution = 20;

let grid = [];
let nextGrid = [];

let isDrawing = false;
let mouseX = 0;
let mouseY = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    cols = Math.floor(width / resolution);
    rows = Math.floor(height / resolution);
    initGrid();
}

function initGrid() {
    grid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
    nextGrid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
}

window.addEventListener('mousedown', () => isDrawing = true);
window.addEventListener('mouseup', () => isDrawing = false);
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function addDye(x, y) {
    let col = Math.floor(x / resolution);
    let row = Math.floor(y / resolution);
    let radius = 2;

    for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
            let c = col + i;
            let r = row + j;
            if (c >= 0 && c < cols && r >= 0 && r < rows) {
                grid[c][r] = 255;
            }
        }
    }
}

function update() {
    if (isDrawing) {
        addDye(mouseX, mouseY);
    }

    for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
            let sum = grid[i][j];
            sum += grid[i - 1][j];
            sum += grid[i + 1][j];
            sum += grid[i][j - 1];
            sum += grid[i][j + 1];

            let avg = sum / 5;
            nextGrid[i][j] = avg * 0.96;
        }
    }

    let temp = grid;
    grid = nextGrid;
    nextGrid = temp;
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let colorVal = Math.floor(grid[i][j]);
            if (colorVal > 0) {
                ctx.fillStyle = `rgb(0, ${colorVal}, ${colorVal + 50})`;
                ctx.fillRect(i * resolution, j * resolution, resolution, resolution);
            }
        }
    }
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
animate();