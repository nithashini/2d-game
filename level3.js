// Level 3: Magma Caverns
// Mechanics: Crumbling Platforms, High-pressure Steam Vents, Falling Fireballs, Rising Magma Hazard
class Level3 {
    constructor() {
        this.name = "Level 3: Magma Caverns";
        this.description = "Escape the volcanic core! Watch out for crumbling platforms and use steam vents to launch upward!";
        this.mode = "magma";
        this.width = 1800;
        this.height = 1400; // Vertical climb
        this.playerStart = { x: 100, y: 1280 };

        this.lavaY = 1430;
        this.lavaSpeed = 0.35;
        this.rubiesCollected = 0;
        this.totalRubies = 4;

        this.init();
    }

    init() {
        // Platforms (Solid volcanic rock & crumbling platforms)
        this.platforms = [
            // Bottom starting ground
            { x: 0, y: 1330, width: 350, height: 80, color: '#451a03' },
            { x: 420, y: 1300, width: 140, height: 24, color: '#451a03' },

            // Tier 1 (y: 1100 - 1250)
            { x: 620, y: 1220, width: 120, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 820, y: 1140, width: 140, height: 24, color: '#451a03' },
            { x: 1040, y: 1080, width: 120, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 1250, y: 1160, width: 200, height: 24, color: '#451a03' },

            // Tier 2 (y: 900 - 1050)
            { x: 1100, y: 960, width: 130, height: 24, color: '#451a03' },
            { x: 880, y: 920, width: 120, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 640, y: 880, width: 140, height: 24, color: '#451a03' },
            { x: 380, y: 860, width: 150, height: 24, color: '#451a03' },
            { x: 160, y: 840, width: 130, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },

            // Tier 3 (y: 650 - 800)
            { x: 80, y: 720, width: 160, height: 24, color: '#451a03' },
            { x: 300, y: 680, width: 130, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 500, y: 640, width: 140, height: 24, color: '#451a03' },
            { x: 740, y: 620, width: 130, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 960, y: 600, width: 160, height: 24, color: '#451a03' },
            { x: 1220, y: 620, width: 180, height: 24, color: '#451a03' },

            // Tier 4 (y: 380 - 550)
            { x: 1440, y: 520, width: 140, height: 24, color: '#451a03' },
            { x: 1280, y: 440, width: 130, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 1050, y: 400, width: 140, height: 24, color: '#451a03' },
            { x: 820, y: 360, width: 130, height: 22, color: '#78350f', crumbling: true, state: 'idle', timer: 0 },
            { x: 580, y: 320, width: 140, height: 24, color: '#451a03' },

            // Summit Platform (Hatch)
            { x: 200, y: 220, width: 280, height: 30, color: '#451a03' }
        ];

        // Attach onStepped to crumbling platforms
        this.platforms.forEach(p => {
            if (p.crumbling) {
                p.onStepped = () => {
                    if (p.state === 'idle') {
                        p.state = 'shaking';
                        p.timer = 40; // frames until collapse (~0.7s)
                    }
                };
            }
        });

        // Steam Vents (launch player skyward)
        this.vents = [
            { x: 1320, y: 1140, width: 40, height: 20, force: -16 },
            { x: 420, y: 840, width: 40, height: 20, force: -15 },
            { x: 1000, y: 580, width: 40, height: 20, force: -16 }
        ];

        // Falling Fireballs
        this.fireballs = [];
        this.fireballTimer = 0;

        // Magma Rubies
        this.rubies = [
            { x: 880, y: 1090, collected: false, bob: 0 },
            { x: 220, y: 790, collected: false, bob: 1 },
            { x: 1300, y: 570, collected: false, bob: 2 },
            { x: 640, y: 270, collected: false, bob: 3 }
        ];

        // Summit Escape Hatch
        this.hatch = {
            x: 240,
            y: 150,
            width: 70,
            height: 70
        };
    }

    update(player) {
        // Slowly rise the lava
        this.lavaY -= this.lavaSpeed;

        // Lava collision
        if (player.y + player.height >= this.lavaY) {
            player.takeDamage(3); // instant defeat if submerged
        }

        // Bubbling lava particles
        if (Math.random() < 0.3) {
            window.particles.add(
                player.x + (Math.random() - 0.5) * 600,
                this.lavaY,
                (Math.random() - 0.5) * 1.5,
                -Math.random() * 3 - 1,
                '#f97316',
                Math.random() * 5 + 3,
                20
            );
        }

        // Update Crumbling Platforms
        this.platforms.forEach(p => {
            if (p.crumbling) {
                if (p.state === 'shaking') {
                    p.timer--;
                    if (p.timer <= 0) {
                        p.state = 'broken';
                        p.timer = 150; // respawn timer (2.5 seconds)
                        p.hidden = true;
                    }
                } else if (p.state === 'broken') {
                    p.timer--;
                    if (p.timer <= 0) {
                        p.state = 'idle';
                        p.hidden = false;
                        window.particles.createDust(p.x + p.width/2, p.y, 8, '#b45309');
                    }
                }
            }
        });

        // Steam Vents Trigger
        this.vents.forEach(v => {
            // Emitting steam particles
            if (Math.random() < 0.6) {
                window.particles.add(
                    v.x + Math.random() * v.width,
                    v.y,
                    (Math.random() - 0.5) * 0.8,
                    -Math.random() * 5 - 4,
                    '#e2e8f0',
                    Math.random() * 6 + 4,
                    25
                );
            }

            // Launch Player
            if (player.x + player.width > v.x && player.x < v.x + v.width &&
                player.y + player.height >= v.y - 10 && player.y + player.height <= v.y + 15) {
                player.vy = v.force;
                player.isGrounded = false;
                window.sounds.playBounce();
                window.particles.createSparks(v.x + v.width/2, v.y, 10, '#f97316');
            }
        });

        // Falling Fireballs
        this.fireballTimer++;
        if (this.fireballTimer % 80 === 0) {
            this.fireballs.push({
                x: player.x + (Math.random() - 0.5) * 500,
                y: player.y - 450,
                vy: Math.random() * 3 + 3.5,
                radius: 8
            });
        }

        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            fb.y += fb.vy;
            window.particles.add(fb.x, fb.y, (Math.random() - 0.5), -1, '#ef4444', 4, 8);

            // Collide with player
            if (Math.hypot(player.x + player.width/2 - fb.x, player.y + player.height/2 - fb.y) < fb.radius + 14) {
                player.takeDamage(1);
                this.fireballs.splice(i, 1);
                continue;
            }

            // Collide with platforms or out of bounds
            if (fb.y > this.height) {
                this.fireballs.splice(i, 1);
            }
        }

        // Collect Rubies
        this.rubies.forEach(r => {
            if (!r.collected) {
                r.bob += 0.08;
                const by = r.y + Math.sin(r.bob) * 5;
                if (Math.hypot(player.x + player.width/2 - (r.x + 12), player.y + player.height/2 - (by + 12)) < 24) {
                    r.collected = true;
                    this.rubiesCollected++;
                    window.sounds.playGem();
                    window.particles.createSparks(r.x + 12, r.y + 12, 14, '#ef4444');
                }
            }
        });

        // Escape Hatch Entry
        const h = this.hatch;
        if (player.x + player.width > h.x && player.x < h.x + h.width &&
            player.y + player.height > h.y && player.y < h.y + h.height) {
            window.sounds.playLevelComplete();
            window.particles.createConfetti(h.x + 35, h.y + 35, 40);
            return { complete: true, nextLevel: 4 };
        }

        return null;
    }

    render(ctx, camera) {
        // Dark volcanic cave background
        ctx.fillStyle = '#1c100b';
        ctx.fillRect(0, 0, this.width, this.height);

        // Ambient lava glow from below
        const lavaGradient = ctx.createLinearGradient(0, this.lavaY - 350, 0, this.lavaY);
        lavaGradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
        lavaGradient.addColorStop(1, 'rgba(239, 68, 68, 0.35)');
        ctx.fillStyle = lavaGradient;
        ctx.fillRect(0, this.lavaY - 350, this.width, 350);

        // Platforms
        for (const p of this.platforms) {
            if (p.hidden) continue;

            ctx.save();
            if (p.state === 'shaking') {
                const shakeX = (Math.random() - 0.5) * 4;
                ctx.translate(shakeX, 0);
            }

            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);

            // Platform top rim
            ctx.fillStyle = p.crumbling ? '#ea580c' : '#b45309';
            ctx.fillRect(p.x, p.y, p.width, 4);

            if (p.crumbling) {
                // Cracked texture
                ctx.fillStyle = '#1c100b';
                ctx.fillRect(p.x + p.width/3, p.y + 2, 3, p.height - 4);
                ctx.fillRect(p.x + (p.width/3)*2, p.y + 2, 4, p.height - 4);
            }
            ctx.restore();
        }

        // Steam Vents
        for (const v of this.vents) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(v.x, v.y, v.width, v.height);
            ctx.fillStyle = '#f97316';
            ctx.fillRect(v.x + 4, v.y + 2, v.width - 8, 4);
        }

        // Fireballs
        for (const fb of this.fireballs) {
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Rubies
        for (const r of this.rubies) {
            if (!r.collected) {
                const by = r.y + Math.sin(r.bob) * 5;
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#f87171';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(r.x + 12, by);
                ctx.lineTo(r.x + 24, by + 12);
                ctx.lineTo(r.x + 12, by + 24);
                ctx.lineTo(r.x, by + 12);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Rising Lava
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(0, this.lavaY, this.width, this.height - this.lavaY + 100);
        
        // Lava Surface Wave
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, this.lavaY);
        for (let x = 0; x <= this.width; x += 40) {
            const waveY = Math.sin(Date.now() * 0.005 + x * 0.03) * 6;
            ctx.lineTo(x, this.lavaY + waveY);
        }
        ctx.lineTo(this.width, this.lavaY + 10);
        ctx.lineTo(0, this.lavaY + 10);
        ctx.closePath();
        ctx.fill();

        // Escape Hatch
        const h = this.hatch;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.fillRect(h.x, h.y, h.width, h.height);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(h.x + 8, h.y + 8, h.width - 16, h.height - 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("EXIT", h.x + h.width/2, h.y + h.height/2 + 4);
        ctx.shadowBlur = 0;
    }
}

window.Level3 = Level3;
