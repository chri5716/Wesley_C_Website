/* script.js
   - Mobile navigation toggle
   - Footer year injection across pages
   - Smooth scrolling for internal anchors (progressive enhancement)
   - Minimal lazy image fallback (if needed)
   - Flappy-style game implementation (easier difficulty)
*/

/* ---------- Navigation Toggle (works for all pages) ---------- */
(function navToggle(){
  const toggles = document.querySelectorAll('.nav-toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      // Find the nearest nav (sibling or by ID if set)
      // We keep nav visible on desktop and toggle on mobile via inline style.
      const nav = btn.nextElementSibling || document.querySelector('.nav');
      if (!nav) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      // toggle visible class for simple responsive show/hide
      if (nav.style.display === 'block') {
        nav.style.display = '';
      } else {
        nav.style.display = 'block';
      }
    });
  });
})();

/* ---------- Footer Year Population ---------- */
(function populateYears(){
  const ids = ['year','year2','year3','year4','year5','year6','yearH','yearD','yearR','yearC','yearG','yearHome'];
  const year = new Date().getFullYear();
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = year;
  });
})();

/* ---------- Smooth Scroll for hash links (basic) ---------- */
(function smoothScroll(){
  // Only apply for same-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // update focus for accessibility
        setTimeout(()=> target.focus({preventScroll:true}), 600);
      }
    });
  });
})();

/* ---------- Simple decorative lazy-image fallback (optional) ---------- */
(function lazyFallback(){
  // modern browsers support loading="lazy" on <img>;
  // this function could be extended if you add background images, etc.
})();

/* ---------- Flappy-style Game (ENHANCED) ---------- */
(function flappy(){
  const canvas = document.getElementById('flappyCanvas');
  if (!canvas) return; // only run on game page
  const ctx = canvas.getContext('2d');

  // DOM controls
  const startBtn = document.getElementById('startGame');
  const resetBtn = document.getElementById('resetGame');
  const scoreEl = document.getElementById('gameScore');
  const highScoreEl = document.getElementById('highScore');

  // Canvas size (use attributes from HTML)
  const W = canvas.width;
  const H = canvas.height;

  // Game parameters (easier settings)
  const gravity = 0.35;        // low gravity
  const flapPower = -6.2;      // strong flap
  const pipeSpeed = 1.6;       // slow pipes
  const pipeGap = 120;         // generous gap for easy play
  const pipeWidth = 42;
  const spawnInterval = 160;   // frames between pipes (approx)

  // Game state
  let bird = { x: 72, y: H/2, vy: 0, radius: 12, rotation: 0 };
  let pipes = []; // each pipe: { x, gapY, passed }
  let frame = 0;
  let score = 0;
  let highScore = 0;
  let running = false;
  let rafId = null;
  let gameOverState = false; // Track if showing death screen

  // Jump effects
  let jumpParticles = []; // { x, y, vx, vy, life, maxLife }
  let jumpTrails = []; // { x, y, life, maxLife }
  let lastJumpFrame = 0;

  // Sound system
  let audioContext = null;
  let soundsEnabled = true;

  // Initialize high score from localStorage
  function initHighScore() {
    try {
      const saved = localStorage.getItem('flappyHighScore');
      if (saved !== null) {
        highScore = parseInt(saved, 10);
      }
      if (highScoreEl) highScoreEl.textContent = highScore;
    } catch (e) {
      console.log('localStorage not available');
    }
  }

  // Save high score to localStorage
  function saveHighScore() {
    try {
      localStorage.setItem('flappyHighScore', highScore.toString());
    } catch (e) {
      console.log('Could not save high score');
    }
  }

  // Check and update high score
  function updateHighScore() {
    if (score > highScore) {
      highScore = score;
      if (highScoreEl) highScoreEl.textContent = highScore;
      saveHighScore();
      return true; // New high score!
    }
    return false;
  }

  // Initialize audio
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
      soundsEnabled = false;
    }
  }

  // Sound effects
  function playJumpSound() {
    if (!audioContext || !soundsEnabled) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  function playScoreSound() {
    if (!audioContext || !soundsEnabled) return;
    const frequencies = [400, 500, 600];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      }, i * 100);
    });
  }

  function playGameOverSound() {
    if (!audioContext || !soundsEnabled) return;
    const frequencies = [300, 250, 200];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }, i * 150);
    });
  }

  // Create jump particles
  function createJumpEffects() {
    // Create particle burst
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      jumpParticles.push({
        x: bird.x,
        y: bird.y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 1.5,
        life: 20,
        maxLife: 20
      });
    }

    // Create trail effect
    for (let i = 0; i < 5; i++) {
      jumpTrails.push({
        x: bird.x,
        y: bird.y + i * 2,
        life: 15 + i * 2,
        maxLife: 15 + i * 2
      });
    }
  }

  // Helpers - drawing
  function clear() { ctx.clearRect(0,0,W,H); }

  function drawBackground(){
    // Enhanced gradient sky with clouds
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, '#b3d9ff');
    g.addColorStop(0.5, '#ffe8b2');
    g.addColorStop(1, '#ffeedd');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const cloudX = (frame * 0.3) % (W + 100) - 50;
    drawCloud(cloudX, 60, 40);
    drawCloud((frame * 0.2 + 200) % (W + 100) - 50, 40, 35);
    drawCloud((frame * 0.25 + 350) % (W + 100) - 50, 80, 45);

    // Enhanced ground with texture
    const groundGradient = ctx.createLinearGradient(0, H - 28, 0, H);
    groundGradient.addColorStop(0, '#7A0019');
    groundGradient.addColorStop(1, '#5a0015');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, H - 28, W, 28);
    
    // Ground texture
    ctx.fillStyle = '#8a001f';
    for (let i = 0; i < W; i += 15) {
      ctx.fillRect(i, H - 28, 3, 28);
    }
  }

  function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBird(){
    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    // Update rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.vy * 3, -30), 30);
    ctx.rotate(bird.rotation * Math.PI / 180);

    // Enhanced bird with gradient and details
    const birdGradient = ctx.createRadialGradient(0, -2, 0, 0, 0, bird.radius);
    birdGradient.addColorStop(0, '#fff9a0');
    birdGradient.addColorStop(0.7, '#FFCC33');
    birdGradient.addColorStop(1, '#ffaa00');
    
    ctx.fillStyle = birdGradient;
    ctx.strokeStyle = '#7A0019';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(4, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7A0019';
    ctx.beginPath();
    ctx.arc(5, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(bird.radius, 0);
    ctx.lineTo(bird.radius + 6, -2);
    ctx.lineTo(bird.radius + 6, 2);
    ctx.closePath();
    ctx.fill();

    // Wing highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-3, 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawJumpEffects() {
    // Draw jump particles
    for (let i = jumpParticles.length - 1; i >= 0; i--) {
      const p = jumpParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life--;

      if (p.life > 0) {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFCC33';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        jumpParticles.splice(i, 1);
      }
    }

    // Draw jump trails
    for (let i = jumpTrails.length - 1; i >= 0; i--) {
      const t = jumpTrails[i];
      t.life--;

      if (t.life > 0) {
        const alpha = t.life / t.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = '#FFCC33';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        jumpTrails.splice(i, 1);
      }
    }
  }

  function drawPipes(){
    pipes.forEach(p => {
      // Pipe gradient
      const pipeGradient = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
      pipeGradient.addColorStop(0, '#3d8a3d');
      pipeGradient.addColorStop(0.5, '#2b6b2b');
      pipeGradient.addColorStop(1, '#1f4f1f');
      
      ctx.fillStyle = pipeGradient;
      ctx.strokeStyle = '#163d16';
      ctx.lineWidth = 2;

      // Top pipe with cap
      ctx.fillRect(p.x, 0, pipeWidth, p.gapY - pipeGap/2);
      ctx.strokeRect(p.x, 0, pipeWidth, p.gapY - pipeGap/2);
      ctx.fillStyle = '#4da64d';
      ctx.fillRect(p.x - 3, p.gapY - pipeGap/2 - 18, pipeWidth + 6, 18);
      ctx.strokeRect(p.x - 3, p.gapY - pipeGap/2 - 18, pipeWidth + 6, 18);

      // Bottom pipe with cap
      ctx.fillStyle = pipeGradient;
      ctx.fillRect(p.x, p.gapY + pipeGap/2, pipeWidth, H - (p.gapY + pipeGap/2) - 28);
      ctx.strokeRect(p.x, p.gapY + pipeGap/2, pipeWidth, H - (p.gapY + pipeGap/2) - 28);
      ctx.fillStyle = '#4da64d';
      ctx.fillRect(p.x - 3, p.gapY + pipeGap/2, pipeWidth + 6, 18);
      ctx.strokeRect(p.x - 3, p.gapY + pipeGap/2, pipeWidth + 6, 18);

      // Pipe highlight for depth
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(p.x + 2, 0, 3, p.gapY - pipeGap/2);
      ctx.fillRect(p.x + 2, p.gapY + pipeGap/2, 3, H - (p.gapY + pipeGap/2) - 28);
    });
  }

  function drawScore(){
    ctx.save();
    // Enhanced score display with shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 20px Open Sans, Arial';
    ctx.fillText(`Score: ${score}`, 14, 28);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${score}`, 12, 26);
    
    // High score display
    if (highScore > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 16px Open Sans, Arial';
      ctx.fillText(`High: ${highScore}`, 14, 50);
      ctx.fillStyle = '#FFCC33';
      ctx.fillText(`High: ${highScore}`, 12, 48);
    }
    ctx.restore();
  }

  // spawn a new pipe
  function spawnPipe(){
    const gapY = 80 + Math.random() * (H - 220);
    pipes.push({ x: W + 20, gapY, passed: false });
  }

  // update game physics & state
  function update(){
    frame++;
    
    // Update jump effects
    for (let i = jumpParticles.length - 1; i >= 0; i--) {
      const p = jumpParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      if (p.life <= 0) jumpParticles.splice(i, 1);
    }

    for (let i = jumpTrails.length - 1; i >= 0; i--) {
      jumpTrails[i].life--;
      if (jumpTrails[i].life <= 0) jumpTrails.splice(i, 1);
    }

    // bird physics
    bird.vy += gravity;
    bird.y += bird.vy;

    // spawn pipes periodically
    if (frame % spawnInterval === 0) spawnPipe();

    // move pipes and check passed
    for (let i = pipes.length-1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed;
      if (!p.passed && p.x + pipeWidth < bird.x - bird.radius) {
        p.passed = true;
        score++;
        if (scoreEl) scoreEl.textContent = score;
        playScoreSound();
      }
      // remove offscreen
      if (p.x + pipeWidth < -20) pipes.splice(i,1);
    }

    // collisions: ground
    if (bird.y + bird.radius > H - 28) {
      endGame();
    }

    // collisions with pipes
    for (const p of pipes) {
      if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + pipeWidth) {
        if (bird.y - bird.radius < p.gapY - pipeGap/2 || bird.y + bird.radius > p.gapY + pipeGap/2) {
          endGame();
        }
      }
    }
  }

  // render everything
  function render(forceRender = false){
    if (gameOverState && !forceRender) return; // Don't render during death screen unless forced
    clear();
    drawBackground();
    drawPipes();
    drawJumpEffects();
    drawBird();
    drawScore();
  }

  // game loop
  function loop(){
    update();
    render();
    if (running) rafId = requestAnimationFrame(loop);
  }

  // start & reset
  function start(){
    if (running) return;
    pipes = [];
    frame = 0;
    score = 0;
    gameOverState = false;
    bird = { x: 72, y: H/2, vy: 0, radius: 12, rotation: 0 };
    jumpParticles = [];
    jumpTrails = [];
    if (scoreEl) scoreEl.textContent = score;
    running = true;
    initAudio();
    loop();
  }

  function reset(){
    running = false;
    gameOverState = false;
    if (rafId) cancelAnimationFrame(rafId);
    pipes = [];
    frame = 0;
    score = 0;
    bird = { x: 72, y: H/2, vy: 0, radius: 12, rotation: 0 };
    jumpParticles = [];
    jumpTrails = [];
    if (scoreEl) scoreEl.textContent = 0;
    // draw initial screen
    render();
    drawStartOverlay();
  }

  function endGame(){
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    playGameOverSound();
    
    // Check for new high score
    const isNewHighScore = updateHighScore();
    
    // Render final frame before showing death screen
    render(true); // Force render final frame
    
    // Set game over state and show death screen
    gameOverState = true;
    drawGameOver(isNewHighScore);
  }

  // user controls: flap
  function flap(){
    if (!running && frame === 0) return;
    bird.vy = flapPower;
    createJumpEffects();
    playJumpSound();
    lastJumpFrame = frame;
  }

  // overlays
  function drawStartOverlay(){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(24, H/2 - 50, W - 48, 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Open Sans, Arial';
    ctx.fillText('Click or press Space to flap.', 36, H/2 - 10);
    ctx.font = '16px Open Sans, Arial';
    ctx.fillText('Press Start to begin.', 36, H/2 + 12);
    ctx.restore();
  }

  function drawGameOver(isNewHighScore = false){
    ctx.save();
    
    // Full-screen dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, W, H);
    
    // Death screen container with border
    const boxWidth = W - 80;
    const boxHeight = 180;
    const boxX = 40;
    const boxY = H/2 - boxHeight/2;
    
    // Background box
    ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Border
    ctx.strokeStyle = '#7A0019';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Open Sans, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W/2, boxY + 40);
    
    // Score display
    ctx.font = 'bold 24px Open Sans, Arial';
    ctx.fillText(`Final Score: ${score}`, W/2, boxY + 75);
    
    // High score display
    if (highScore > 0) {
      ctx.fillStyle = '#FFCC33';
      ctx.font = 'bold 20px Open Sans, Arial';
      ctx.fillText(`High Score: ${highScore}`, W/2, boxY + 105);
    }
    
    // New high score message
    if (isNewHighScore) {
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 18px Open Sans, Arial';
      ctx.fillText('🎉 NEW HIGH SCORE! 🎉', W/2, boxY + 135);
    }
    
    // Instructions
    ctx.fillStyle = '#ccc';
    ctx.font = '14px Open Sans, Arial';
    ctx.fillText('Press Reset to try again or Start to play again.', W/2, boxY + 165);
    
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // init draw
  render(); drawStartOverlay();

  // Initialize high score on load
  initHighScore();

  // Input handlers
  canvas.addEventListener('click', () => {
    if (gameOverState) return; // Don't allow clicks during death screen
    if (!running) start();
    flap();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameOverState) return; // Don't allow space during death screen
      if (!running) start();
      flap();
    }
  });

  startBtn.addEventListener('click', () => { start(); });
  resetBtn.addEventListener('click', () => { reset(); });

})();
