const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const earthRadius = 100; // Radius of Earth
const shieldRadius = 130; // Radius of shield around Earth

let flares = []; // Array to hold solar flares
let gameOver = false; // Game over state
let defense = 100; // Defense level (100% initially)
let shieldMeter = 100; // Shield meter (100% initially)
let shieldActive = false; // Whether the shield is active
let points = 0; // Player's points
const sunX = canvas.width / 13; // Sun position (left side of canvas)
const sunY = canvas.height / 2;
const earthX = canvas.width / 1.2; // Earth position (right side of canvas)
const earthY = canvas.height / 2;

// Variables for flare speed and spawn control
let baseFlareSpeed = 0.5; // Slow initial speed
let flareSpawnRate = 0.002; // Slow initial chance to spawn a flare
let flareSpawnIncreaseInterval = 10000; // Increase spawn rate every 10 seconds
let lastSpawnIncreaseTime = performance.now(); // Track when spawn rate was last increased

// Variables for flare speed increase
let flareSpeedIncreaseInterval = 10000; // Increase speed every 10 seconds
let lastSpeedIncreaseTime = performance.now(); // Track when speed was last increased

// Mouse position
let mouseX = 0;
let mouseY = 0;

// Load images
const sunImage = new Image();
sunImage.src = 'sun.png'; // Path to the Sun image

const earthImage = new Image();
earthImage.src = 'earth.png'; // Path to the Earth image

// Ensure images are loaded before starting the game
let imagesLoaded = 0;
const totalImages = 2;

sunImage.onload = earthImage.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop();
    }
};

// Function to draw the Sun with a glowing effect
function drawSun() {
    // Create radial gradient for light effect
    const gradient = ctx.createRadialGradient(sunX, sunY, 50, sunX, sunY, 200);
    gradient.addColorStop(0, 'rgba(255, 204, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');

    // Draw glow effect
    ctx.beginPath();
    ctx.arc(sunX, sunY, 200, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();

    // Draw Sun image
    ctx.drawImage(sunImage, sunX - 100, sunY - 100, 200, 200); // Adjust the size as needed
}

// Function to draw Earth using image
function drawEarth() {
    ctx.drawImage(earthImage, earthX - 100, earthY - 100, 200, 200); // Adjust the size as needed
}

// Function to draw the shield
function drawShield() {
    if (shieldActive) {
        ctx.beginPath();
        ctx.arc(earthX, earthY, shieldRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.closePath();
    }
}

// Solar flare class
class SolarFlare {
    constructor(x, y, speed, glowing = false) {  // Added glowing parameter
        this.x = x;
        this.y = y;
        this.radius = 20; // Solar flare radius
        this.speed = speed; // Speed at which the flare moves
        this.angle = Math.random() * Math.PI * 2; // Random angle for direction
        this.glowing = glowing; // Assign glowing status
    }

    // Draw the solar flare
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.glowing) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, 40);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = 'red';
        }
        ctx.fill();
        ctx.closePath();
    }

    // Update the position of the flare
    update() {
        const dx = earthX - this.x;
        const dy = earthY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (shieldActive) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            if (dist < shieldRadius) {
                this.angle = Math.random() * Math.PI * 2;
            }
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        if (!shieldActive && dist < earthRadius) {
            endGame();
        }
    }

    isClicked(mouseX, mouseY) {
        const dist = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
        return dist < this.radius;
    }
}

// Function to handle game over state
function endGame() {
    gameOver = true;
    const gameOverDiv = document.getElementById('gameOver');
    gameOverDiv.innerHTML = `Game Over<br>Points: ${points}`;
    gameOverDiv.style.display = 'block';
    cancelAnimationFrame(animationFrameId);
}

// Function to generate random solar flares, some with glowing effect
function generateFlare() {
    const flareX = sunX + Math.random() * 100;
    const flareY = sunY + (Math.random() - 0.5) * 200;
    const speed = baseFlareSpeed + Math.random() * 2; // Speed increases over time
    const glowing = Math.random() < 0.3; // 30% chance of a glowing flare
    flares.push(new SolarFlare(flareX, flareY, speed, glowing));
}

// Add beep sound when flare is destroyed
const beepSound = new Audio('What a solar storm sounds like.mp3'); // Make sure to load the sound file

// Handle mouse movements
canvas.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Handle mouse clicks
canvas.addEventListener('click', function () {
    // Check if any flare is clicked
    flares.forEach((flare, index) => {
        if (flare.isClicked(mouseX, mouseY)) {
            beepSound.play(); // Play beep sound on destruction
            if (flare.glowing) {
                points += 2; // Glowing flare gives 2 points
            } else {
                points += 1; // Regular flare gives 1 point
            }
            flares.splice(index, 1); // Remove the clicked flare
            updatePointsDisplay(); // Update the points on screen
        }
    });
});

// Function to update the points display
function updatePointsDisplay() {
    document.getElementById('points').textContent = `Points: ${points}`;
}

// Main game loop
let animationFrameId;
function gameLoop() {
    if (gameOver) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSun();
    drawEarth();
    drawShield();

    // Update and draw flares
    flares.forEach(flare => {
        flare.update();
        flare.draw();
    });

    // Custom cursor
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('+', mouseX - 10, mouseY + 10);

    // Update defense and shield meter
    document.getElementById('defenseStatus').textContent = `Defense: ${defense}%`;
    document.getElementById('shieldMeter').textContent = `Shield: ${Math.max(shieldMeter.toFixed(1), 0)}%`;

    // Spawn new flares at an increasing rate
    if (Math.random() < flareSpawnRate) {
        generateFlare();
    }

    // Shield usage
    if (shieldActive) {
        shieldMeter -= 0.1;
        if (shieldMeter <= 0) {
            shieldActive = false;
            document.getElementById('shieldMeter').style.color = 'yellow';
            alert("Shield Deactivated!"); // Notify user
        }
    }

    // Check if 10 seconds have passed to increase flare spawn rate
    if (performance.now() - lastSpawnIncreaseTime > flareSpawnIncreaseInterval) {
        flareSpawnRate += 0.001; // Gradually increase spawn rate of new flares
        lastSpawnIncreaseTime = performance.now(); // Reset the timer
    }

    // Check if 10 seconds have passed to increase flare speed
    if (performance.now() - lastSpeedIncreaseTime > flareSpeedIncreaseInterval) {
        baseFlareSpeed += 0.05; // Gradually increase base speed of new flares
        lastSpeedIncreaseTime = performance.now(); // Reset the timer
    }

    // Continue the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Toggle shield on space bar press
document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        shieldActive = !shieldActive;
        document.getElementById('shieldMeter').style.color = shieldActive ? 'cyan' : 'yellow';
    }
});

// Initialize points display on window load
window.onload = () => {
    updatePointsDisplay();
    if (imagesLoaded === totalImages) {
        gameLoop();
    }
};
