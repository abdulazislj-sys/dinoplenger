const game = document.getElementById('game');
const dino = document.getElementById('dino');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const lovePopup = document.getElementById('lovePopup');
const continueButton = document.getElementById('continueButton');

const GROUND = 100;
const GRAVITY = 0.78;
const JUMP_POWER = 14.5;

let playing = false;
let gameOver = false;
let jumping = false;
let velocityY = 0;
let dinoY = 0;

let score = 0;
let best = Number(localStorage.getItem('dinoRunnerBest') || 0);
let speed = 6;
let spawnTimer = 0;
let nextSpawn = 90;
let obstacles = [];
let animationId = null;
let loveTriggered = false;
let celebrating = false;
let celebrationTimer = null;

bestEl.textContent = `BEST ${String(best).padStart(5, '0')}`;

function startGame() {
  if (gameOver) restartGame();

  if (!playing) {
    playing = true;
    startScreen.classList.add('hidden');
    dino.classList.add('running');
  }

  jump();
}

function jump() {
  if (!playing || jumping) return;

  jumping = true;
  velocityY = JUMP_POWER;
  dino.classList.remove('running');
}

function createObstacle() {
  const obstacle = document.createElement('div');
  const birdAllowed = score > 250;
  const makeBird = birdAllowed && Math.random() < 0.22;

  obstacle.classList.add('obstacle');

  if (makeBird) {
    obstacle.classList.add('bird');
    obstacle.style.bottom = `${GROUND + 55 + Math.floor(Math.random() * 40)}px`;
  } else {
    obstacle.classList.add('cactus');
    const height = 38 + Math.floor(Math.random() * 36);
    const width = 18 + Math.floor(Math.random() * 14);
    obstacle.style.width = `${width}px`;
    obstacle.style.height = `${height}px`;
  }

  const x = window.innerWidth + 30;
  obstacle.style.left = `${x}px`;
  game.appendChild(obstacle);

  obstacles.push({ el: obstacle, x });
}

function rectsOverlap(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

function triggerLoveCelebration() {
  if (loveTriggered || celebrating) return;

  loveTriggered = true;
  celebrating = true;
  playing = false;

  // Hentikan posisi lompat dan buat Dino berjoget.
  jumping = false;
  velocityY = 0;
  dinoY = 0;
  dino.style.transform = 'translateY(0px)';
  dino.classList.remove('running');
  dino.classList.add('dancing');

  // Hilangkan rintangan agar fokus ke momen perayaan.
  obstacles.forEach(o => o.el.remove());
  obstacles = [];

  lovePopup.classList.remove('hidden');

  if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 160]);
}

function endGame() {
  if (gameOver) return;

  playing = false;
  gameOver = true;
  dino.classList.remove('running');

  const finalScore = Math.floor(score);
  finalScoreEl.textContent = `Skor: ${finalScore}`;

  if (finalScore > best) {
    best = finalScore;
    localStorage.setItem('dinoRunnerBest', best);
    bestEl.textContent = `BEST ${String(best).padStart(5, '0')}`;
  }

  if (navigator.vibrate) navigator.vibrate([60, 30, 90]);

  gameOverScreen.classList.remove('hidden');
}

function restartGame() {
  obstacles.forEach(o => o.el.remove());
  obstacles = [];

  score = 0;
  speed = 6;
  spawnTimer = 0;
  nextSpawn = 90;
  dinoY = 0;
  velocityY = 0;
  jumping = false;
  gameOver = false;
  playing = true;

  dino.style.transform = 'translateY(0px)';
  dino.classList.add('running');

  scoreEl.textContent = '00000';
  gameOverScreen.classList.add('hidden');
  startScreen.classList.add('hidden');
  game.classList.remove('night');
  loveTriggered = false;
  celebrating = false;
  clearTimeout(celebrationTimer);
  lovePopup.classList.add('hidden');
  dino.classList.remove('dancing');
}

function update() {
  if (playing && !gameOver) {
    if (jumping) {
      dinoY += velocityY;
      velocityY -= GRAVITY;

      if (dinoY <= 0) {
        dinoY = 0;
        velocityY = 0;
        jumping = false;
        dino.classList.add('running');
      }

      dino.style.transform = `translateY(${-dinoY}px)`;
    }

    score += 0.12;
    const wholeScore = Math.floor(score);
    scoreEl.textContent = String(wholeScore).padStart(5, '0');

    // Tepat saat skor mencapai 26, Dino berhenti dan berjoget.
    if (wholeScore >= 26 && !loveTriggered) {
      triggerLoveCelebration();
    }

    speed = 6 + Math.floor(wholeScore / 180);

    // Mode malam berganti setiap sekitar 500 poin.
    if (Math.floor(wholeScore / 500) % 2 === 1) {
      game.classList.add('night');
    } else {
      game.classList.remove('night');
    }

    // Jika perayaan sedang tampil, hentikan update game pada frame ini.
    if (celebrating) {
      animationId = requestAnimationFrame(update);
      return;
    }

    spawnTimer++;
    if (spawnTimer >= nextSpawn) {
      createObstacle();
      spawnTimer = 0;
      nextSpawn = Math.max(
        52,
        70 + Math.floor(Math.random() * 75) - Math.floor(speed * 2)
      );
    }

    const dinoRect = dino.getBoundingClientRect();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      obstacle.x -= speed;
      obstacle.el.style.left = `${obstacle.x}px`;

      const obstacleRect = obstacle.el.getBoundingClientRect();
      if (rectsOverlap(dinoRect, obstacleRect)) {
        endGame();
        break;
      }

      if (obstacle.x < -100) {
        obstacle.el.remove();
        obstacles.splice(i, 1);
      }
    }
  }

  animationId = requestAnimationFrame(update);
}

function handleAction(event) {
  if (event) event.preventDefault();
  startGame();
}

document.addEventListener('pointerdown', handleAction, { passive: false });

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    handleAction(event);
  }
});

restartButton.addEventListener('pointerdown', (event) => {
  event.stopPropagation();
  restartGame();
});

continueButton.addEventListener('pointerdown', (event) => {
  event.stopPropagation();

  // Tutup popup lalu lanjutkan permainan dengan Dino kembali berlari.
  lovePopup.classList.add('hidden');
  celebrating = false;
  playing = true;
  dino.classList.remove('dancing');
  dino.classList.add('running');
});

window.addEventListener('resize', () => {
  // Posisi rintangan tetap mengikuti sistem koordinat viewport.
});

update();
