// Game settings
const INITIAL_SNAKE_SPEED = 10;
const SNAKE_SPEED_INCREMENT = 1;
const SNAKE_SPEED_ACCELERATION = 0.2;
const SCORE_THRESHOLD = 10;
const SECOND_SPEED_THRESHOLD = 50;
const MAX_SPEED = 25;

// Snake and fruit settings
const SNAKE_SIZE = 10;
const FRUIT_SIZE = 10;
const BIG_FRUIT_SIZE = 20;
const BIG_FRUIT_EATING_RADIUS = 20;

// Get canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Responsive window settings
function resizeCanvas() {
    canvas.width = window.innerWidth < 720 ? window.innerWidth : 720;
    canvas.height = window.innerHeight < 480 ? window.innerHeight : 480;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Load sounds
const eatSound = new Audio('eating.mp3');
const gameOverSound = new Audio('over.mp3');
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;

document.addEventListener('click', () => {
    backgroundMusic.play().catch(() => {});
}, { once: true });

// Game variables
let snakeHeadPosition = [100, 50];
let snakeBodySegments = [[100, 50], [90, 50], [80, 50], [70, 50]];

let fruitPosition = randomPosition();
let fruitAvailable = true;

let bigFruitPosition = [0, 0];
let bigFruitAvailable = false;

let playerScore = 0;
let smallFruitCount = 0;

let currentDirection = 'RIGHT';
let nextDirection = currentDirection;

let highScore = 0;
let snakeSpeed = INITIAL_SNAKE_SPEED;
let gameRunning = true;

// Load and save high score
function loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved !== null) highScore = parseInt(saved);
    updateScoreDisplay();
}
function saveHighScore() {
    localStorage.setItem('snakeHighScore', highScore.toString());
}
function updateScoreDisplay() {
    document.getElementById('score').textContent = `Score: ${playerScore}`;
    document.getElementById('highscore').textContent = `High Score: ${highScore}`;
}

// Random fruit position
function randomPosition() {
    return [
        Math.floor(Math.random() * (canvas.width / 10)) * 10,
        Math.floor(Math.random() * (canvas.height / 10)) * 10
    ];
}

// Game over
function handleGameOver() {
    gameRunning = false;
    gameOverSound.play().catch(() => {});
    if (playerScore > highScore) {
        highScore = playerScore;
        saveHighScore();
    }
    document.getElementById('final-score').textContent = `Your Score: ${playerScore}`;
    document.getElementById('game-over').style.display = 'flex';
}

// Reset game
function resetGame() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    snakeHeadPosition = [centerX, centerY];
    snakeBodySegments = [
        [centerX, centerY],
        [centerX - 10, centerY],
        [centerX - 20, centerY],
        [centerX - 30, centerY]
    ];
    fruitPosition = randomPosition();
    bigFruitPosition = [0, 0];
    fruitAvailable = true;
    bigFruitAvailable = false;
    playerScore = 0;
    smallFruitCount = 0;
    currentDirection = 'RIGHT';
    nextDirection = 'RIGHT';
    snakeSpeed = INITIAL_SNAKE_SPEED;
    gameRunning = true;
    document.getElementById('game-over').style.display = 'none';
    updateScoreDisplay();
    requestAnimationFrame(gameLoop);
}

// Controls - Keyboard
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            if (currentDirection !== 'DOWN') nextDirection = 'UP';
            break;
        case 'ArrowDown':
            if (currentDirection !== 'UP') nextDirection = 'DOWN';
            break;
        case 'ArrowLeft':
            if (currentDirection !== 'RIGHT') nextDirection = 'LEFT';
            break;
        case 'ArrowRight':
            if (currentDirection !== 'LEFT') nextDirection = 'RIGHT';
            break;
        case 'p':
        case 'P':
            if (!gameRunning) resetGame();
            break;
    }
});

// Controls - Touch
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, false);

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && currentDirection !== 'LEFT') nextDirection = 'RIGHT';
        else if (diffX < 0 && currentDirection !== 'RIGHT') nextDirection = 'LEFT';
    } else {
        if (diffY > 0 && currentDirection !== 'UP') nextDirection = 'DOWN';
        else if (diffY < 0 && currentDirection !== 'DOWN') nextDirection = 'UP';
    }
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, false);

// Draw game
function drawGame() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Snake
    snakeBodySegments.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#00FF00' : '#00B400';
        ctx.fillRect(segment[0], segment[1], SNAKE_SIZE, SNAKE_SIZE);
    });

    // Fruits
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(fruitPosition[0], fruitPosition[1], FRUIT_SIZE, FRUIT_SIZE);

    if (bigFruitAvailable) {
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(bigFruitPosition[0], bigFruitPosition[1], BIG_FRUIT_SIZE, BIG_FRUIT_SIZE);
    }
}

// Update logic
function updateGame() {
    currentDirection = nextDirection;

    switch (currentDirection) {
        case 'UP':
            snakeHeadPosition[1] -= SNAKE_SIZE;
            break;
        case 'DOWN':
            snakeHeadPosition[1] += SNAKE_SIZE;
            break;
        case 'LEFT':
            snakeHeadPosition[0] -= SNAKE_SIZE;
            break;
        case 'RIGHT':
            snakeHeadPosition[0] += SNAKE_SIZE;
            break;
    }

    const newHead = [snakeHeadPosition[0], snakeHeadPosition[1]];
    snakeBodySegments.unshift(newHead);

    // Wall collision
    if (
        snakeHeadPosition[0] < 0 || snakeHeadPosition[0] >= canvas.width ||
        snakeHeadPosition[1] < 0 || snakeHeadPosition[1] >= canvas.height
    ) {
        handleGameOver();
        return;
    }

    // Self collision
    for (let i = 1; i < snakeBodySegments.length; i++) {
        if (snakeBodySegments[i][0] === snakeHeadPosition[0] &&
            snakeBodySegments[i][1] === snakeHeadPosition[1]) {
            handleGameOver();
            return;
        }
    }

    // Eat fruit
    if (snakeHeadPosition[0] === fruitPosition[0] && snakeHeadPosition[1] === fruitPosition[1]) {
        playerScore++;
        smallFruitCount++;
        eatSound.play().catch(() => {});
        fruitPosition = randomPosition();

        if (smallFruitCount % 5 === 0) {
            bigFruitAvailable = true;
            bigFruitPosition = randomPosition();
        }

        if (playerScore % SCORE_THRESHOLD === 0 && snakeSpeed < MAX_SPEED) {
            snakeSpeed += SNAKE_SPEED_INCREMENT;
        }
        if (playerScore >= SECOND_SPEED_THRESHOLD && snakeSpeed < MAX_SPEED) {
            snakeSpeed += SNAKE_SPEED_ACCELERATION;
        }
        updateScoreDisplay();
    } else if (
        bigFruitAvailable &&
        Math.abs(snakeHeadPosition[0] - bigFruitPosition[0]) < BIG_FRUIT_EATING_RADIUS &&
        Math.abs(snakeHeadPosition[1] - bigFruitPosition[1]) < BIG_FRUIT_EATING_RADIUS
    ) {
        playerScore += 5;
        bigFruitAvailable = false;
        eatSound.play().catch(() => {});
        updateScoreDisplay();
    } else {
        snakeBodySegments.pop();
    }
}

// Main game loop
function gameLoop() {
    if (!gameRunning) return;
    setTimeout(() => {
        drawGame();
        updateGame();
        requestAnimationFrame(gameLoop);
    }, 1000 / snakeSpeed);
}

// Start
loadHighScore();
updateScoreDisplay();
requestAnimationFrame(gameLoop);
