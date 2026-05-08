import { Runner } from './game/Runner.js';

const canvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('scoreDisplay');
const distDisplay = document.getElementById('distDisplay');
const finalScore = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');

let runner = null;
let animId = null;
let highScore = parseInt(localStorage.getItem('gammee_hs') || '0', 10);

function startGame() {
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  hud.classList.remove('hidden');

  if (runner) runner.destroy();
  runner = new Runner(canvas, onTick, onGameOver);
  runner.start();
}

function onTick(score, meters) {
  scoreDisplay.textContent = `Score: ${score}`;
  distDisplay.textContent = `${meters} m`;
}

function onGameOver(score, meters) {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('gammee_hs', highScore);
  }
  hud.classList.add('hidden');
  finalScore.innerHTML = `Score: <span>${score}</span> &nbsp;|&nbsp; Distance: <span>${meters} m</span>`;
  highScoreEl.innerHTML = `Best: <span>${highScore}</span>`;
  gameOverScreen.classList.remove('hidden');
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Keyboard shortcut on start/game-over screens
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (!startScreen.classList.contains('hidden')) startGame();
    else if (!gameOverScreen.classList.contains('hidden')) startGame();
  }
});
