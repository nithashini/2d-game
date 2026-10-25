// Level 4: Phantom Catacombs
// Mechanics: Dynamic Lantern Light, Stealth Fog-of-War, Phantom Guards with Vision Cones, Key-Gate Puzzles
class Level4 {
    constructor() {
        this.name = "Level 4: Phantom Catacombs";
        this.description = "Stealth required! Avoid patrolling phantom vision cones. Find 3 keys (Bronze, Silver, Gold) to unlock the sanctuary gates.";
        this.mode = "stealth";
        this.width = 2500;
        this.height = 700;
        this.playerStart = { x: 70, y: 550 };

        this.keysFound = { bronze: false, silver: false, gold: false };
        this.gates = { bronze: true, silver: true, gold: true }; // true = locked

        this.init();
    }

    init() {
        // Catacomb stone platforms & corridors
        this.platforms = [
            // Base ground floor
            { x: 0, y: 620, width: 2500, height: 80, color: '#1e293b' },

            // Corridor walls / pillars
            { x: 300, y: 440, width: 40, height: 180, color: '#334155' },
            { x: 480, y: 500, width: 140, height: 24, color: '#334155' },
            { x: 680, y: 380, width: 150, height: 24, color: '#334155' },
            { x: 880, y: 460, width: 140, height: 24, color: '#334155' },

            // Pillar separating section 1 and 2
            { x: 1060, y: 340, width: 40, height: 280, color: '#334155' },

            // Section 2 upper balconies
            { x: 1100, y: 480, width: 160, height: 24, color: '#334155' },
            { x: 1320, y: 380, width: 150, height: 24, color: '#334155' },
            { x: 1520, y: 460, width: 160, height: 24, color: '#334155' },

            // Pillar separating section 2 and 3
            { x: 1720, y: 340, width: 40, height: 280, color: '#334155' },

            // Section 3 platforms
            { x: 1760, y: 480, width: 150, height: 24, color: '#334155' },
            { x: 1960, y: 380, width: 160, height: 24, color: '#334155' },
            { x: 2160, y: 480, width: 180, height: 24, color: '#334155' }
        ];

        // 3 Locked Gates [x, y, width, height, type]
        this.gateList = [
            { id: 'bronze', x: 1040, y: 480, width: 20, height: 140, color: '#cd7f32', unlocked: false },
            { id: 'silver', x: 1700, y: 480, width: 20, height: 140, color: '#94a3b8', unlocked: false },
            { id: 'gold',   x: 2320, y: 480, width: 20, height: 140, color: '#facc15', unlocked: false }
        ];

        // 3 Keys to find
        this.keys = [
            { id: 'bronze', x: 730, y: 340, color: '#cd7f32', collected: false, name: 'Bronze Key' },
            { id: 'silver', x: 1380, y: 340, color: '#e2e8f0', collected: false, name: 'Silver Key' },
            { id: 'gold',   x: 2020, y: 340, color: '#fbbf24', collected: false, name: 'Gold Key' }
        ];

        // Patrolling Phantom Guards with Vision Cones
        this.guards = [
            { x: 420, y: 580, minX: 350, maxX: 750, vx: 1.5, dir: 1, state: 'patrol', alertTimer: 0, visionRange: 160 },
            { x: 1200, y: 580, minX: 1120, maxX: 1550, vx: 1.6, dir: 1, state: 'patrol', alertTimer: 0, visionRange: 180 },
            { x: 1850, y: 580, minX: 1780, maxX: 2200, vx: 1.8, dir: 1, state: 'patrol', alertTimer: 0, visionRange: 190 }
        ];

        // Sanctuary Portal at the very end
        this.sanctuary = {
            x: 2380,
            y: 520,
            width: 70,
            height: 100
        };
    }

    update(player) {
        // Collect Keys
        this.keys.forEach(k => {
            if (!k.collected) {
                if (Math.hypot(player.x + player.width/2 - (k.x + 10), player.y + player.height/2 - (k.y + 10)) < 24) {
                    k.collected = true;
                    this.keysFound[k.id] = true;
                    window.sounds.playKey();
                    window.particles.createSparks(k.x + 10, k.y + 10, 16, k.color);

                    // Unlock gate automatically
                    const matchingGate = this.gateList.find(g => g.id === k.id);
                    if (matchingGate) {
                        matchingGate.unlocked = true;
                        window.particles.createConfetti(matchingGate.x + 10, matchingGate.y + 70, 20);
                    }
                }
            }
        });

        // Gate Blockers for player (if gate is locked, acts as solid wall)
        this.gateList.forEach(g => {
            if (!g.unlocked) {
                if (player.x + player.width > g.x && player.x < g.x + g.width &&
                    player.y + player.height > g.y && player.y < g.y + g.height) {
                    if (player.vx > 0) player.x = g.x - player.width;
                    else if (player.vx < 0) player.x = g.x + g.width;
                    player.vx = 0;
                }
            }
        });

        // Update Phantom Guards & Vision Cones
        let anyDetected = false;
        this.guards.forEach(g => {
            // Guard movement
            if (g.state === 'patrol') {
                g.x += g.vx * g.dir;
                if (g.x >= g.maxX) {
                    g.dir = -1;
                    g.x = g.maxX;
                } else if (g.x <= g.minX) {
                    g.dir = 1;
                    g.x = g.minX;
                }
            } else if (g.state === 'chase') {
                // Chase player
                const dx = (player.x + player.width/2) - g.x;
                g.dir = Math.sign(dx) || 1;
                g.x += g.dir * 2.8; // faster chase speed
                g.alertTimer--;
                if (g.alertTimer <= 0) {
                    g.state = 'patrol';
                }
            }

            // Vision Cone check
            // Cone extends in g.dir direction
            const pCenterX = player.x + player.width / 2;
            const pCenterY = player.y + player.height / 2;
            const dist = Math.hypot(pCenterX - g.x, pCenterY - (g.y - 10));

            const inFront = (g.dir === 1 && pCenterX > g.x) || (g.dir === -1 && pCenterX < g.x);
            const verticalClose = Math.abs(pCenterY - g.y) < 60;

            if (inFront && dist < g.visionRange && verticalClose) {
                if (g.state !== 'chase') {
                    window.sounds.playAlert();
                    window.particles.createSparks(g.x, g.y - 25, 8, '#ef4444');
                }
                g.state = 'chase';
                g.alertTimer = 140; // pursue for ~2.3 seconds
                anyDetected = true;
            }

            // Collision with guard deals damage
            if (Math.hypot(pCenterX - g.x, pCenterY - g.y) < 26) {
                player.takeDamage(1);
            }
        });

        player.isDetected = anyDetected;

        // Reach Sanctuary
        const s = this.sanctuary;
        if (this.keysFound.bronze && this.keysFound.silver && this.keysFound.gold) {
            if (player.x + player.width > s.x && player.x < s.x + s.width &&
                player.y + player.height > s.y && player.y < s.y + s.height) {
                window.sounds.playLevelComplete();
                window.particles.createConfetti(s.x + 35, s.y + 50, 40);
                return { complete: true, nextLevel: 5 };
            }
        }

        return null;
    }

    render(ctx, camera) {
        // Dark dungeon stone background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, this.width, this.height);

        // Background arches & brick details
        ctx.fillStyle = '#111827';
        for (let x = 60; x < this.width; x += 220) {
            ctx.beginPath();
            ctx.arc(x + 50, 480, 40, Math.PI, 0);
            ctx.lineTo(x + 90, 620);
            ctx.lineTo(x + 10, 620);
            ctx.closePath();
            ctx.fill();
        }

        // Platforms
        for (const p of this.platforms) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Stone top trim
            ctx.fillStyle = '#475569';
            ctx.fillRect(p.x, p.y, p.width, 4);
        }

        // Gates
        for (const g of this.gateList) {
            if (!g.unlocked) {
                ctx.fillStyle = g.color;
                ctx.fillRect(g.x, g.y, g.width, g.height);
                // Iron bars effect
                ctx.fillStyle = '#0f172a';
                for (let y = g.y + 10; y < g.y + g.height; y += 22) {
                    ctx.fillRect(g.x + 3, y, g.width - 6, 4);
                }
            } else {
                // Open gate remains
                ctx.fillStyle = 'rgba(100, 116, 139, 0.2)';
                ctx.fillRect(g.x, g.y, g.width, g.height);
            }
        }

        // Keys
        for (const k of this.keys) {
            if (!k.collected) {
                ctx.save();
                ctx.fillStyle = k.color;
                ctx.shadowColor = k.color;
                ctx.shadowBlur = 12;
                // Draw key icon
                ctx.beginPath();
                ctx.arc(k.x + 10, k.y + 8, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(k.x + 8, k.y + 12, 4, 10);
                ctx.fillRect(k.x + 12, k.y + 16, 4, 3);
                ctx.fillRect(k.x + 12, k.y + 20, 3, 3);
                ctx.restore();
            }
        }

        // Phantom Guards & Vision Cones
        for (const g of this.guards) {
            // Draw Vision Cone
            ctx.save();
            const coneColor = (g.state === 'chase') ? 'rgba(239, 68, 68, 0.35)' : 'rgba(250, 204, 21, 0.22)';
            ctx.fillStyle = coneColor;
            ctx.beginPath();
            ctx.moveTo(g.x, g.y - 12);
            ctx.lineTo(g.x + g.dir * g.visionRange, g.y - 50);
            ctx.lineTo(g.x + g.dir * g.visionRange, g.y + 35);
            ctx.closePath();
            ctx.fill();

            // Alert "!" above head if chasing
            if (g.state === 'chase') {
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("!", g.x, g.y - 35);
            }

            // Phantom Ghost Sprite
            ctx.fillStyle = '#7c3aed'; // Deep purple phantom
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(g.x, g.y - 12, 12, Math.PI, 0);
            ctx.lineTo(g.x + 12, g.y + 10);
            ctx.lineTo(g.x + 6, g.y + 6);
            ctx.lineTo(g.x, g.y + 10);
            ctx.lineTo(g.x - 6, g.y + 6);
            ctx.lineTo(g.x - 12, g.y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Ghostly Eyes
            ctx.fillStyle = (g.state === 'chase') ? '#ff0000' : '#fbbf24';
            ctx.fillRect(g.x + (g.dir > 0 ? 2 : -6), g.y - 14, 4, 4);
            ctx.fillRect(g.x + (g.dir > 0 ? 7 : -1), g.y - 14, 4, 4);
            ctx.restore();
        }

        // Sanctuary Exit Portal
        const s = this.sanctuary;
        const allKeys = this.keysFound.bronze && this.keysFound.silver && this.keysFound.gold;
        ctx.save();
        if (allKeys) {
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 20;
            ctx.fillRect(s.x, s.y, s.width, s.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("SANCTUARY", s.x + s.width/2, s.y + s.height/2);
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(s.x, s.y, s.width, s.height);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(s.x, s.y, s.width, s.height);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("LOCKED", s.x + s.width/2, s.y + s.height/2);
        }
        ctx.restore();

        // Dynamic Darkness & Lantern Overlay!
        // We draw a dark radial mask centered on the player so only their lantern area is illuminated!
        if (window.activePlayer) {
            ctx.save();
            const px = window.activePlayer.x + window.activePlayer.width / 2;
            const py = window.activePlayer.y + window.activePlayer.height / 2;
            const lanternRadius = 240;

            const radialGradient = ctx.createRadialGradient(px, py, 50, px, py, lanternRadius);
            radialGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            radialGradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
            radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.94)');

            ctx.fillStyle = radialGradient;
            const vx = camera ? camera.x : 0;
            const vy = camera ? camera.y : 0;
            const vw = camera ? camera.width : this.width;
            const vh = camera ? camera.height : this.height;
            ctx.fillRect(vx, vy, vw, vh);
            ctx.restore();
        }
    }
}

window.Level4 = Level4;
