// Main Game Engine & Controller
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Target virtual resolution
        this.canvas.width = 960;
        this.canvas.height = 540;

        this.keys = {};
        this.currentLevelIndex = 1;
        this.currentLevel = null;
        this.player = null;

        // Camera
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };

        // Game State
        this.isPaused = false;
        this.isGameOver = false;
        this.isGameWon = false;
        this.levelTransitionTimer = 0;

        // Stats
        this.score = 0;
        this.deaths = 0;

        this.initInput();
        this.loadLevel(1);
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Audio context start on first interaction
            window.sounds.init();

            if (e.code === 'KeyP') {
                this.isPaused = !this.isPaused;
                this.updateUI();
            }

            if (e.code === 'KeyR') {
                this.restartLevel();
            }

            // Quick level switch with number keys 1-5
            if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
                const lvl = parseInt(e.code.replace('Digit', ''));
                this.loadLevel(lvl);
            }

            // Jump trigger
            if ((e.code === 'ArrowUp' || e.code === 'KeyW') && this.player) {
                this.player.jump();
            }

            if (e.code === 'Space' && this.player) {
                // In cyber level, Space fires the blaster; in other levels it jumps
                if (this.currentLevel && this.currentLevel.mode === 'cyber') {
                    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                        const angle = this.player.facing === 1 ? -Math.PI / 4 : -3 * Math.PI / 4;
                        this.player.shoot(angle);
                    } else {
                        this.player.shoot();
                    }
                } else {
                    this.player.jump();
                }
            }

            // Blaster trigger (Z or F or Click in cyber mode)
            if ((e.code === 'KeyZ' || e.code === 'KeyF') && this.player) {
                if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                    const angle = this.player.facing === 1 ? -Math.PI / 4 : -3 * Math.PI / 4;
                    this.player.shoot(angle);
                } else {
                    this.player.shoot();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Mouse click for shooting in Cyber level (aims accurately in click direction)
        this.canvas.addEventListener('mousedown', (e) => {
            window.sounds.init();
            if (this.player && this.currentLevel && this.currentLevel.mode === 'cyber') {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const mouseWorldX = (e.clientX - rect.left) * scaleX + this.camera.x;
                const mouseWorldY = (e.clientY - rect.top) * scaleY + this.camera.y;

                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;

                const angle = Math.atan2(mouseWorldY - playerCenterY, mouseWorldX - playerCenterX);
                this.player.shoot(angle);
            }
        });
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        this.isGameOver = false;
        this.isGameWon = false;
        this.keys = {};
        window.particles.clear();

        switch (index) {
            case 1:
                this.currentLevel = new Level1();
                break;
            case 2:
                this.currentLevel = new Level2();
                break;
            case 3:
                this.currentLevel = new Level3();
                break;
            case 4:
                this.currentLevel = new Level4();
                break;
            case 5:
                this.currentLevel = new Level5();
                break;
            default:
                this.currentLevel = new Level1();
                this.currentLevelIndex = 1;
        }

        window.currentLevelMode = this.currentLevel.mode;

        // Spawn player
        this.player = new Player(this.currentLevel.playerStart.x, this.currentLevel.playerStart.y);
        window.activePlayer = this.player;
        if (this.currentLevel.mode === 'cyber') {
            this.player.hasBlaster = true;
        } else if (this.currentLevel.mode === 'moon') {
            this.player.hasJetpack = true;
        }

        // Position camera immediately
        this.updateCamera(true);
        this.updateUI();
    }

    restartLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    updateCamera(snap = false) {
        if (!this.player || !this.currentLevel) return;

        const targetX = this.player.x + this.player.width / 2 - this.camera.width / 2;
        const targetY = this.player.y + this.player.height / 2 - this.camera.height / 2;

        if (snap) {
            this.camera.x = targetX;
            this.camera.y = targetY;
        } else {
            this.camera.x += (targetX - this.camera.x) * 0.1;
            this.camera.y += (targetY - this.camera.y) * 0.1;
        }

        // Clamp camera to level bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.currentLevel.width - this.camera.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.currentLevel.height - this.camera.height));
    }

    update() {
        if (this.isPaused || this.isGameOver || this.isGameWon) return;

        // Update player
        this.player.update(this.keys, this.currentLevel.platforms, this.currentLevel.mode);

        // Update current level
        const levelResult = this.currentLevel.update(this.player);

        // Check level completion
        if (levelResult && levelResult.complete) {
            if (levelResult.gameWon) {
                this.isGameWon = true;
                this.updateUI();
            } else if (levelResult.nextLevel) {
                this.loadLevel(levelResult.nextLevel);
                return;
            }
        }

        // Check player death
        if (this.player.isDead) {
            this.deaths++;
            this.isGameOver = true;
            this.updateUI();
        }

        // Particles
        window.particles.update();

        // Camera follow
        this.updateCamera();

        // Update on-screen HUD elements
        this.updateHUD();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        // Camera translation
        this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

        // Render current level
        if (this.currentLevel) {
            this.currentLevel.render(this.ctx, this.camera);
        }

        // Render particles (in world coordinates)
        window.particles.render(this.ctx);

        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }

        this.ctx.restore();

        // Render HUD (fixed to screen)
        this.renderHUDOverlay();
    }

    renderHUDOverlay() {
        const ctx = this.ctx;

        // Hearts / Health
        if (this.player) {
            for (let i = 0; i < this.player.maxHealth; i++) {
                const hx = 24 + i * 26;
                const hy = 24;
                ctx.fillStyle = (i < this.player.health) ? '#ef4444' : '#475569';
                ctx.beginPath();
                ctx.arc(hx, hy, 7, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Fuel Gauge (Level 2)
        if (this.currentLevelIndex === 2 && this.player) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillRect(24, 46, 120, 12);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(24, 46, (this.player.fuel / this.player.maxFuel) * 120, 12);
            ctx.strokeStyle = '#94a3b8';
            ctx.strokeRect(24, 46, 120, 12);
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px sans-serif';
            ctx.fillText("JETPACK FUEL", 26, 42);
        }

        // Stealth Detection Alert (Level 4)
        if (this.currentLevelIndex === 4 && this.player && this.player.isDetected) {
            ctx.save();
            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("DETECTED! ESCAPE LINE OF SIGHT!", this.canvas.width / 2, 70);
            ctx.restore();
        }

        // Game Over Overlay
        if (this.isGameOver) {
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("MISSION FAILED", this.canvas.width / 2, 230);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '16px sans-serif';
            ctx.fillText("Press [R] to Respawn and Try Again", this.canvas.width / 2, 280);
            ctx.restore();
        }

        // Victory Screen Overlay
        if (this.isGameWon) {
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 42px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("VICTORY! ALL 5 WORLDS CONQUERED!", this.canvas.width / 2, 210);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#38bdf8';
            ctx.font = '18px sans-serif';
            ctx.fillText(`You mastered all dimensions with ${this.deaths} total respawns!`, this.canvas.width / 2, 265);

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '15px sans-serif';
            ctx.fillText("Press [1-5] to replay any level, or [R] to restart from Level 1", this.canvas.width / 2, 320);
            ctx.restore();
        }

        // Pause Overlay
        if (this.isPaused) {
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("PAUSED", this.canvas.width / 2, 250);

            ctx.font = '15px sans-serif';
            ctx.fillText("Press [P] to Resume", this.canvas.width / 2, 290);
            ctx.restore();
        }
    }

    updateHUD() {
        const levelNameEl = document.getElementById('level-name');
        const levelObjectiveEl = document.getElementById('level-objective');
        const levelItemsEl = document.getElementById('level-items');

        if (this.currentLevel && levelNameEl) {
            levelNameEl.textContent = this.currentLevel.name;
            levelObjectiveEl.textContent = this.currentLevel.description;

            // Specific items text
            if (this.currentLevelIndex === 1) {
                levelItemsEl.textContent = `Emerald Gems: ${this.currentLevel.gemsCollected} / ${this.currentLevel.totalGems}`;
            } else if (this.currentLevelIndex === 2) {
                levelItemsEl.textContent = `Jetpack Equipped | Laser Barriers Active`;
            } else if (this.currentLevelIndex === 3) {
                levelItemsEl.textContent = `Fire Rubies: ${this.currentLevel.rubiesCollected} / ${this.currentLevel.totalRubies} | Lava Rising!`;
            } else if (this.currentLevelIndex === 4) {
                const k = this.currentLevel.keysFound;
                levelItemsEl.textContent = `Keys: [Bronze: ${k.bronze ? '✓' : '✗'}] [Silver: ${k.silver ? '✓' : '✗'}] [Gold: ${k.gold ? '✓' : '✗'}]`;
            } else if (this.currentLevelIndex === 5) {
                levelItemsEl.textContent = `Blaster Armed [Z / Click] | Boss HP: ${Math.max(0, Math.ceil(this.currentLevel.boss.hp))}%`;
            }
        }
    }

    updateUI() {
        // Highlight active level select button
        document.querySelectorAll('.level-btn').forEach(btn => {
            const lvl = parseInt(btn.dataset.level);
            if (lvl === this.currentLevelIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(this.loop);
    }
}

function startGame() {
    if (window.game) return;
    window.game = new Game();

    // Bind Level Buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lvl = parseInt(e.target.dataset.level);
            window.game.loadLevel(lvl);
        });
    });

    // Sound toggle button
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            const enabled = window.sounds.toggle();
            soundToggle.textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        });
    }

    // Restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            window.game.restartLevel();
        });
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startGame();
} else {
    document.addEventListener('DOMContentLoaded', startGame);
    window.addEventListener('load', startGame);
}
