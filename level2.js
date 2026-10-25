// Level 2: Lunar Low-Gravity Outpost
// Mechanics: Low-gravity physics (0.18g), Jetpack flight, Timing Laser Barriers, Floating Space Drones
class Level2 {
    constructor() {
        this.name = "Level 2: Lunar Outpost";
        this.description = "Low gravity active! Use your Jetpack (Hold W / Space / Up) to navigate laser security gates to the Escape Shuttle.";
        this.mode = "moon";
        this.width = 2600;
        this.height = 750;
        this.playerStart = { x: 70, y: 550 };

        this.stars = [];
        this.init();
    }

    init() {
        // Starfield background
        this.stars = [];
        for (let i = 0; i < 140; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.8,
                alpha: Math.random() * 0.8 + 0.2
            });
        }

        // Platforms (Lunar metal platforms & floating stations)
        this.platforms = [
            // Base spawn platform
            { x: 0, y: 640, width: 350, height: 110, color: '#334155' },
            // Floating relay pillars
            { x: 380, y: 520, width: 140, height: 26, color: '#475569' },
            { x: 580, y: 390, width: 160, height: 26, color: '#475569' },
            { x: 420, y: 240, width: 130, height: 26, color: '#475569' },
            { x: 650, y: 150, width: 180, height: 26, color: '#475569' },

            // Lower corridor floor
            { x: 800, y: 640, width: 500, height: 110, color: '#334155' },
            // Tower 1 platforms
            { x: 920, y: 480, width: 150, height: 26, color: '#475569' },
            { x: 1150, y: 360, width: 160, height: 26, color: '#475569' },
            { x: 960, y: 220, width: 140, height: 26, color: '#475569' },

            // Middle section
            { x: 1380, y: 640, width: 450, height: 110, color: '#334155' },
            { x: 1420, y: 460, width: 130, height: 26, color: '#475569' },
            { x: 1620, y: 340, width: 140, height: 26, color: '#475569' },
            { x: 1480, y: 200, width: 150, height: 26, color: '#475569' },
            { x: 1720, y: 130, width: 160, height: 26, color: '#475569' },

            // End shuttle docking pad
            { x: 1950, y: 560, width: 220, height: 26, color: '#475569' },
            { x: 2250, y: 640, width: 350, height: 110, color: '#334155' }
        ];

        // Laser Barriers (Active timer cycles)
        // [x, y, width, height, cycleOffset, activeDuration, totalCycle]
        this.lasers = [
            { x: 550, y: 200, width: 8, height: 190, timer: 0, activeTime: 100, cycle: 180, active: true },
            { x: 890, y: 120, width: 8, height: 360, timer: 60, activeTime: 100, cycle: 180, active: true },
            { x: 1330, y: 200, width: 8, height: 260, timer: 30, activeTime: 90, cycle: 170, active: true },
            { x: 1600, y: 100, width: 8, height: 240, timer: 90, activeTime: 95, cycle: 180, active: true },
            { x: 1900, y: 320, width: 8, height: 240, timer: 45, activeTime: 90, cycle: 170, active: true }
        ];

        // Plasma Fuel Cells (instant fuel refill + bonus score)
        this.fuelCells = [
            { x: 470, y: 200, collected: false, bob: 0 },
            { x: 1000, y: 180, collected: false, bob: 1 },
            { x: 1530, y: 160, collected: false, bob: 2 },
            { x: 1770, y: 90, collected: false, bob: 3 }
        ];

        // Floating Drones (patrolling vertically/horizontally)
        this.drones = [
            { x: 740, y: 300, vx: 0, vy: 1.8, minY: 180, maxY: 480 },
            { x: 1240, y: 220, vx: 0, vy: -1.6, minY: 140, maxY: 420 },
            { x: 1550, y: 400, vx: 1.5, vy: 0, minX: 1420, maxX: 1700 },
            { x: 2050, y: 440, vx: 0, vy: 1.5, minY: 320, maxY: 520 }
        ];

        // Shuttle at end
        this.shuttle = {
            x: 2360,
            y: 520,
            width: 100,
            height: 120
        };
    }

    update(player) {
        // Laser Cycle Update
        this.lasers.forEach(l => {
            l.timer = (l.timer + 1) % l.cycle;
            l.active = l.timer < l.activeTime;

            // Check collision with player if active
            if (l.active) {
                if (player.x + player.width > l.x && player.x < l.x + l.width &&
                    player.y + player.height > l.y && player.y < l.y + l.height) {
                    player.takeDamage(1);
                }
            }
        });

        // Fuel cells collection
        this.fuelCells.forEach(fc => {
            if (!fc.collected) {
                fc.bob += 0.08;
                const by = fc.y + Math.sin(fc.bob) * 5;
                if (Math.hypot(player.x + player.width/2 - (fc.x + 10), player.y + player.height/2 - (by + 10)) < 24) {
                    fc.collected = true;
                    player.fuel = player.maxFuel;
                    window.sounds.playGem();
                    window.particles.createSparks(fc.x + 10, fc.y + 10, 14, '#38bdf8');
                }
            }
        });

        // Drone movement & collision
        this.drones.forEach(d => {
            if (d.vy !== 0) {
                d.y += d.vy;
                if (d.y <= d.minY || d.y >= d.maxY) d.vy *= -1;
            }
            if (d.vx !== 0) {
                d.x += d.vx;
                if (d.x <= d.minX || d.x >= d.maxX) d.vx *= -1;
            }

            // Hit player
            if (Math.hypot(player.x + player.width/2 - d.x, player.y + player.height/2 - d.y) < 26) {
                player.takeDamage(1);
            }
        });

        // Falling into deep space
        if (player.y > this.height + 60) {
            player.takeDamage(3);
        }

        // Reaching Shuttle
        if (player.x + player.width > this.shuttle.x + 10 &&
            player.x < this.shuttle.x + this.shuttle.width - 10 &&
            player.y + player.height > this.shuttle.y + 20 &&
            player.y < this.shuttle.y + this.shuttle.height + 10) {
            window.sounds.playLevelComplete();
            window.particles.createConfetti(this.shuttle.x + 50, this.shuttle.y + 50, 40);
            return { complete: true, nextLevel: 3 };
        }

        return null;
    }

    render(ctx, camera) {
        // Deep Space Background
        ctx.fillStyle = '#050714';
        ctx.fillRect(0, 0, this.width, this.height);

        // Twinkling stars
        ctx.fillStyle = '#ffffff';
        for (const s of this.stars) {
            ctx.globalAlpha = s.alpha * (0.7 + Math.sin(Date.now() * 0.003 + s.x) * 0.3);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Giant Moon / Earth in background
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(600, 180, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Platforms
        for (const p of this.platforms) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Neon cyan edge
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(p.x, p.y, p.width, 3);
        }

        // Lasers
        for (const l of this.lasers) {
            // Emitter nodes top and bottom
            ctx.fillStyle = '#64748b';
            ctx.fillRect(l.x - 4, l.y - 6, l.width + 8, 8);
            ctx.fillRect(l.x - 4, l.y + l.height - 2, l.width + 8, 8);

            if (l.active) {
                ctx.save();
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#f87171';
                ctx.shadowBlur = 12;
                ctx.fillRect(l.x, l.y, l.width, l.height);
                ctx.fillStyle = '#fef2f2';
                ctx.fillRect(l.x + 2, l.y, l.width - 4, l.height);
                ctx.restore();
            } else {
                // Warning low flash when about to activate
                if (l.timer > l.activeTime - 25) {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
                    ctx.fillRect(l.x, l.y, l.width, l.height);
                }
            }
        }

        // Fuel Cells
        for (const fc of this.fuelCells) {
            if (!fc.collected) {
                const by = fc.y + Math.sin(fc.bob) * 5;
                ctx.fillStyle = '#38bdf8';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 10;
                ctx.fillRect(fc.x, by, 16, 22);
                ctx.fillStyle = '#e0f2fe';
                ctx.fillRect(fc.x + 3, by + 3, 10, 16);
                ctx.shadowBlur = 0;
            }
        }

        // Drones
        for (const d of this.drones) {
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
            ctx.fill();
            // Drone red scanning eye
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Antenna
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y - 14);
            ctx.lineTo(d.x, d.y - 22);
            ctx.stroke();
        }

        // Escape Shuttle
        const s = this.shuttle;
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(s.x + s.width / 2, s.y);
        ctx.lineTo(s.x + s.width, s.y + s.height);
        ctx.lineTo(s.x, s.y + s.height);
        ctx.closePath();
        ctx.fill();

        // Cockpit window
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(s.x + s.width / 2, s.y + 40, 16, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thruster glow
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(s.x + 20, s.y + s.height - 4, s.width - 40, 6);
    }
}

window.Level2 = Level2;
