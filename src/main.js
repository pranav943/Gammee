import { Runner } from './game/Runner.js';

const canvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('scoreDisplay');
const distDisplay = document.getElementById('distDisplay');
const finalScore = document.getElementById('finalScore');
const highScoreEl = document.getElementById('highScore');
const deathMsg = document.getElementById('deathMsg');

let runner = null;
let highScore = parseInt(localStorage.getItem('gammee_hs') || '0', 10);

const DEATH_MSGS = {
  snake: ['Swallowed by a snake!', 'Hissssss... game over.', 'The snake got you!'],
  fish:  ['Chomped by a flying fish!', 'Fish > Human.', 'That fish was FAST!'],
  obs:   ['You crashed!', 'Next time, jump!', 'Obstacle wins.'],
};

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

function onGameOver(score, meters, cause = 'obs') {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('gammee_hs', highScore);
  }
  hud.classList.add('hidden');

  const msgs = DEATH_MSGS[cause] || DEATH_MSGS.obs;
  deathMsg.textContent = msgs[Math.floor(Math.random() * msgs.length)];

  finalScore.innerHTML = `Score: <span>${score}</span> &nbsp;|&nbsp; Distance: <span>${meters} m</span>`;
  highScoreEl.innerHTML = `Best: <span>${highScore}</span>`;
  gameOverScreen.classList.remove('hidden');
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (!startScreen.classList.contains('hidden')) startGame();
    else if (!gameOverScreen.classList.contains('hidden')) startGame();
  }
});
