// Canvas roundRect compatibility helper
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        this.rect(x, y, w, h);
    };
}

// Player entity with level-aware physics and abilities
class Player {
    constructor(x, y) {
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x || 50;
        this.y = y || 300;
        this.width = 24;
        this.height = 34;
        this.vx = 0;
        this.vy = 0;
        
        // Physics constants (modified per level)
        this.speed = 4.2;
        this.jumpForce = -9.2;
        this.gravity = 0.45;
        this.friction = 0.82;
        
        // State
        this.isGrounded = false;
        this.facing = 1; // 1: right, -1: left
        this.animTimer = 0;
        this.jumpCount = 0;
        this.maxJumps = 2; // double jump default
        
        // Stats
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerableTimer = 0;
        this.isDead = false;
        
        // Jetpack (Level 2)
        this.hasJetpack = false;
        this.fuel = 100;
        this.maxFuel = 100;
        
        // Stealth (Level 4)
        this.isDetected = false;
        this.detectionAlertTimer = 0;
        
        // Blaster / Gun (Level 5)
        this.hasBlaster = false;
        this.shootCooldown = 0;
        this.bullets = [];

        // Visual squash & stretch
        this.scaleX = 1;
        this.scaleY = 1;
    }

    update(keys, platforms, levelMode) {
        if (this.isDead) return;

        // Apply level specific modifiers
        if (levelMode === 'moon') {
            this.gravity = 0.18;
            this.hasJetpack = true;
            this.maxJumps = 1;
        } else if (levelMode === 'magma') {
            this.gravity = 0.48;
            this.hasJetpack = false;
            this.maxJumps = 2;
        } else if (levelMode === 'stealth') {
            this.gravity = 0.45;
            this.hasJetpack = false;
            this.maxJumps = 1;
        } else if (levelMode === 'cyber') {
            this.gravity = 0.45;
            this.hasJetpack = false;
            this.hasBlaster = true;
            this.maxJumps = 2;
        } else {
            // standard (Level 1)
            this.gravity = 0.45;
            this.hasJetpack = false;
            this.hasBlaster = false;
            this.maxJumps = 2;
        }

        // Horizontal Movement
        let moveX = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) {
            moveX -= 1;
            this.facing = -1;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            moveX += 1;
            this.facing = 1;
        }

        if (moveX !== 0) {
            this.vx += moveX * 0.9;
            if (Math.abs(this.vx) > this.speed) {
                this.vx = Math.sign(this.vx) * this.speed;
            }
            this.animTimer += 0.2;
            if (this.isGrounded && Math.random() < 0.25) {
                window.particles.createDust(this.x + this.width / 2, this.y + this.height, 1);
            }
        } else {
            this.vx *= this.friction;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jetpack Handling (Level 2)
        if (this.hasJetpack && (keys['ArrowUp'] || keys['KeyW'] || keys['Space'])) {
            if (this.fuel > 0) {
                this.vy -= 0.55;
                if (this.vy < -6) this.vy = -6;
                this.fuel = Math.max(0, this.fuel - 0.7);
                window.particles.createThrusterSmoke(this.x + this.width / 2, this.y + this.height - 4, this.vx * 0.3);
                if (Math.random() < 0.3) {
                    window.sounds.playJetpack();
                }
            }
        } else if (this.isGrounded && this.hasJetpack) {
            this.fuel = Math.min(this.maxFuel, this.fuel + 1.2);
        }

        // Gravity
        this.vy += this.gravity;
        if (this.vy > 12) this.vy = 12;

        // Move horizontally & collide
        this.x += this.vx;
        this.handleHorizontalCollisions(platforms);

        // Move vertically & collide
        this.y += this.vy;
        this.isGrounded = false;
        this.handleVerticalCollisions(platforms);

        // Squash & stretch recovery
        this.scaleX += (1 - this.scaleX) * 0.15;
        this.scaleY += (1 - this.scaleY) * 0.15;

        // Invulnerability
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }

        // Blaster shooting cooldown & update bullets (Level 5)
        if (this.shootCooldown > 0) this.shootCooldown--;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life--;
            window.particles.add(b.x, b.y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, '#00f0ff', 2.5, 8);
            if (b.life <= 0 || b.x < 0 || b.x > 3000) {
                this.bullets.splice(i, 1);
            }
        }
    }

    jump() {
        if (this.isGrounded || this.jumpCount < this.maxJumps) {
            this.vy = this.jumpForce;
            this.jumpCount++;
            this.isGrounded = false;
            this.scaleX = 0.75;
            this.scaleY = 1.35;
            window.particles.createDust(this.x + this.width / 2, this.y + this.height, 4);
            window.sounds.playJump();
        }
    }

    shoot(targetAngle = null) {
        if (!this.hasBlaster || this.shootCooldown > 0) return;
        this.shootCooldown = 12; // rate of fire
        const bulletSpeed = 9.5;
        let vx, vy;
        if (targetAngle !== null) {
            vx = Math.cos(targetAngle) * bulletSpeed;
            vy = Math.sin(targetAngle) * bulletSpeed;
            this.facing = (vx < 0) ? -1 : 1;
        } else {
            vx = this.facing * bulletSpeed;
            vy = 0;
        }
        this.bullets.push({
            x: this.facing === 1 ? this.x + this.width + 2 : this.x - 6,
            y: this.y + this.height / 2 - 2,
            vx: vx,
            vy: vy,
            width: 8,
            height: 4,
            life: 90
        });
        window.sounds.playShoot();
        window.particles.createSparks(this.facing === 1 ? this.x + this.width : this.x, this.y + this.height / 2, 4, '#00f0ff');
    }

    handleHorizontalCollisions(platforms) {
        for (const p of platforms) {
            if (p.hidden || p.isPassThrough) continue;
            if (this.checkCollision(this, p)) {
                if (this.vx > 0) {
                    this.x = p.x - this.width;
                } else if (this.vx < 0) {
                    this.x = p.x + p.width;
                }
                this.vx = 0;
            }
        }
    }

    handleVerticalCollisions(platforms) {
        for (const p of platforms) {
            if (p.hidden) continue;
            if (p.isPassThrough) {
                // One-way platform: only land on top when falling
                if (this.vy > 0 && 
                    (this.y + this.height - this.vy <= p.y + 4) &&
                    this.checkCollision(this, p)) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.jumpCount = 0;
                    if (p.onStepped) p.onStepped();
                }
                continue;
            }

            if (this.checkCollision(this, p)) {
                if (this.vy > 0) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.jumpCount = 0;
                    if (p.onStepped) p.onStepped();
                } else if (this.vy < 0) {
                    this.y = p.y + p.height;
                    this.vy = 0;
                }
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    takeDamage(amount = 1) {
        if (this.invulnerableTimer > 0 || this.isDead) return;
        this.health -= amount;
        this.invulnerableTimer = 60; // 1 second invulnerability
        this.scaleX = 1.3;
        this.scaleY = 0.7;
        window.sounds.playHit();
        window.particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 12, '#ef4444');

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            window.sounds.playExplosion();
            window.particles.createExplosion(this.x + this.width / 2, this.y + this.height / 2, 30);
        }
    }

    render(ctx) {
        if (this.isDead) return;

        // Flicker when hurt
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height);
        ctx.scale(this.facing * this.scaleX, this.scaleY);

        // Body dimensions relative to anchor (bottom-center)
        const w = this.width;
        const h = this.height;

        // Jetpack on back (Level 2)
        if (this.hasJetpack) {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-w/2 - 5, -h + 10, 5, 14);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-w/2 - 4, -h + 12, 3, 10);
        }

        // Legs / Running animation
        const legOffset = Math.sin(this.animTimer * 2) * 4;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-w/2 + 2, -7 + (this.isGrounded ? legOffset : -2), 6, 8);
        ctx.fillRect(w/2 - 8, -7 + (this.isGrounded ? -legOffset : 2), 6, 8);

        // Torso / Suit
        ctx.fillStyle = '#3b82f6'; // Bright hero blue
        ctx.beginPath();
        ctx.roundRect(-w/2, -h + 11, w, h - 17, 4);
        ctx.fill();

        // Chest Emblem
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-3, -h + 15, 6, 6);

        // Head / Helmet
        ctx.fillStyle = '#0f172a'; // Dark sleek helmet
        ctx.beginPath();
        ctx.roundRect(-w/2 - 1, -h, w + 2, 13, 5);
        ctx.fill();

        // Visor Glow
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(1, -h + 3, w/2, 6, 2);
        ctx.fill();

        // Blaster Arm (Level 5)
        if (this.hasBlaster) {
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(4, -h + 15, 10, 5);
            ctx.fillStyle = '#00f0ff';
            ctx.fillRect(12, -h + 16, 4, 3);
        }

        // Lantern / Torch in Hand (Level 4)
        if (window.currentLevelMode === 'stealth') {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(3, -h + 16, 4, 6);
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(5, -h + 19, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Render Active Bullets
        for (const b of this.bullets) {
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(b.x, b.y, b.width, b.height);
            ctx.shadowBlur = 0;
        }
    }
}

window.Player = Player;
