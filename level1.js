// Level 1: Verdant Forest
// Classic 2D Platformer - Collect 5 Forest Gems to unlock the Warp Portal
class Level1 {
    constructor() {
        this.name = "Level 1: Verdant Forest";
        this.description = "Collect all 5 Emerald Gems to power up the Ancient Warp Gate!";
        this.mode = "standard";
        this.width = 2400;
        this.height = 650;
        this.playerStart = { x: 60, y: 480 };

        this.gemsCollected = 0;
        this.totalGems = 5;
        this.portalUnlocked = false;

        this.init();
    }

    init() {
        // Platforms [x, y, width, height, type]
        this.platforms = [
            // Starting ground
            { x: 0, y: 550, width: 450, height: 100, color: '#15803d' },
            // Gap 1, then ground
            { x: 530, y: 550, width: 400, height: 100, color: '#15803d' },
            // Elevated islands
            { x: 200, y: 430, width: 140, height: 24, color: '#16a34a' },
            { x: 400, y: 350, width: 120, height: 24, color: '#16a34a' },
            { x: 580, y: 280, width: 160, height: 24, color: '#16a34a' },
            { x: 800, y: 380, width: 130, height: 24, color: '#16a34a' },
            
            // Midsection
            { x: 990, y: 550, width: 500, height: 100, color: '#15803d' },
            { x: 1050, y: 440, width: 130, height: 24, color: '#16a34a' },
            { x: 1250, y: 360, width: 140, height: 24, color: '#16a34a' },
            { x: 1450, y: 290, width: 160, height: 24, color: '#16a34a' },

            // High canopy branch
            { x: 1150, y: 220, width: 220, height: 20, color: '#854d0e', isPassThrough: true },

            // Far section
            { x: 1560, y: 550, width: 350, height: 100, color: '#15803d' },
            { x: 1720, y: 430, width: 120, height: 24, color: '#16a34a' },
            { x: 1900, y: 350, width: 130, height: 24, color: '#16a34a' },
            
            // End Island
            { x: 2080, y: 520, width: 320, height: 130, color: '#15803d' }
        ];

        // Bounce Mushrooms
        this.mushrooms = [
            { x: 480, y: 535, width: 36, height: 18, bounceForce: -13 },
            { x: 1515, y: 535, width: 36, height: 18, bounceForce: -14 }
        ];

        // Hazards (Spikes & Pits)
        this.spikes = [
            { x: 450, y: 630, width: 80, height: 20 },
            { x: 930, y: 630, width: 60, height: 20 },
            { x: 1300, y: 535, width: 70, height: 15 }
        ];

        // Gems to collect
        this.gems = [
            { x: 260, y: 390, collected: false, bob: 0 },
            { x: 650, y: 240, collected: false, bob: 1 },
            { x: 1220, y: 180, collected: false, bob: 2 },
            { x: 1520, y: 250, collected: false, bob: 3 },
            { x: 1950, y: 310, collected: false, bob: 4 }
        ];

        // Forest Slimes (Enemies)
        this.enemies = [
            { x: 620, y: 526, width: 26, height: 24, minX: 540, maxX: 900, vx: 1.2, squish: 0 },
            { x: 1080, y: 526, width: 26, height: 24, minX: 1000, maxX: 1280, vx: -1.4, squish: 0 },
            { x: 1650, y: 526, width: 26, height: 24, minX: 1580, maxX: 1880, vx: 1.5, squish: 0 }
        ];

        // Portal at the end
        this.portal = {
            x: 2280,
            y: 430,
            width: 50,
            height: 90,
            pulse: 0
        };
    }

    update(player) {
        // Check Gem Pickups
        this.gems.forEach(gem => {
            if (!gem.collected) {
                gem.bob += 0.08;
                const bobY = gem.y + Math.sin(gem.bob) * 5;
                if (Math.hypot(player.x + player.width/2 - (gem.x + 12), player.y + player.height/2 - (bobY + 12)) < 26) {
                    gem.collected = true;
                    this.gemsCollected++;
                    window.sounds.playGem();
                    window.particles.createSparks(gem.x + 12, gem.y + 12, 16, '#10b981');

                    if (this.gemsCollected >= this.totalGems) {
                        this.portalUnlocked = true;
                        window.sounds.playLevelComplete();
                        window.particles.createConfetti(this.portal.x + 25, this.portal.y + 45, 30);
                    }
                }
            }
        });

        // Bounce Mushrooms
        this.mushrooms.forEach(m => {
            if (player.x + player.width > m.x && player.x < m.x + m.width &&
                player.y + player.height >= m.y && player.y + player.height <= m.y + 12 &&
                player.vy > 0) {
                player.vy = m.bounceForce;
                player.isGrounded = false;
                window.sounds.playBounce();
                window.particles.createDust(m.x + m.width/2, m.y, 6, '#f43f5e');
            }
        });

        // Spike collisions
        this.spikes.forEach(s => {
            if (player.x + player.width > s.x && player.x < s.x + s.width &&
                player.y + player.height > s.y && player.y < s.y + s.height) {
                player.takeDamage(1);
            }
        });

        // Pit fall death
        if (player.y > this.height + 60) {
            player.takeDamage(3);
        }

        // Enemy Patrolling & Collision
        this.enemies.forEach(e => {
            e.x += e.vx;
            if (e.x <= e.minX || e.x >= e.maxX) {
                e.vx *= -1;
            }
            e.squish += 0.1;

            // Player stomping enemy vs taking damage
            if (player.x + player.width > e.x && player.x < e.x + e.width &&
                player.y + player.height > e.y && player.y < e.y + e.height) {
                
                // If player is falling from above: Stomp enemy!
                if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 12) {
                    player.vy = -7.5; // bounce off enemy
                    window.sounds.playBounce();
                    window.particles.createExplosion(e.x + e.width/2, e.y + e.height/2, 15, ['#22c55e', '#86efac']);
                    // Respawn enemy further away
                    e.x = e.minX;
                } else {
                    player.takeDamage(1);
                }
            }
        });

        // Portal Entry check
        this.portal.pulse += 0.05;
        if (this.portalUnlocked) {
            if (player.x + player.width > this.portal.x && player.x < this.portal.x + this.portal.width &&
                player.y + player.height > this.portal.y && player.y < this.portal.y + this.portal.height) {
                return { complete: true, nextLevel: 2 };
            }
        }

        return null;
    }

    render(ctx, camera) {
        // Parallax Mountain & Tree Background
        ctx.save();
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#7dd3fc');
        skyGradient.addColorStop(0.7, '#bae6fd');
        skyGradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Distant Mountains
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        for (let x = 0; x < this.width + 400; x += 300) {
            ctx.lineTo(x, 420);
            ctx.lineTo(x + 150, 220);
            ctx.lineTo(x + 300, 420);
        }
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();

        // Background Trees
        ctx.fillStyle = '#166534';
        for (let x = 40; x < this.width; x += 180) {
            ctx.fillRect(x + 15, 420, 14, 130);
            ctx.beginPath();
            ctx.arc(x + 22, 400, 35, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Platforms
        for (const p of this.platforms) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Grass topper
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(p.x, p.y, p.width, 6);
        }

        // Spikes
        ctx.fillStyle = '#64748b';
        for (const s of this.spikes) {
            const count = Math.floor(s.width / 16);
            for (let i = 0; i < count; i++) {
                ctx.beginPath();
                ctx.moveTo(s.x + i * 16, s.y + s.height);
                ctx.lineTo(s.x + i * 16 + 8, s.y);
                ctx.lineTo(s.x + (i + 1) * 16, s.y + s.height);
                ctx.fill();
            }
        }

        // Bounce Mushrooms
        for (const m of this.mushrooms) {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(m.x + m.width/2 - 4, m.y + 6, 8, m.height - 6);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(m.x + m.width/2, m.y + 6, m.width/2, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(m.x + m.width/2 - 5, m.y + 4, 3, 0, Math.PI * 2);
            ctx.arc(m.x + m.width/2 + 5, m.y + 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Forest Slimes
        for (const e of this.enemies) {
            const squishOffset = Math.sin(e.squish) * 3;
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.ellipse(e.x + e.width/2, e.y + e.height - 10 + squishOffset/2, e.width/2, e.height/2 - squishOffset, 0, 0, Math.PI * 2);
            ctx.fill();
            // Slime Eyes
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(e.x + 5, e.y + 8, 4, 6);
            ctx.fillRect(e.x + 15, e.y + 8, 4, 6);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(e.x + (e.vx > 0 ? 7 : 5), e.y + 10, 2, 3);
            ctx.fillRect(e.x + (e.vx > 0 ? 17 : 15), e.y + 10, 2, 3);
        }

        // Gems
        for (const g of this.gems) {
            if (!g.collected) {
                const bobY = g.y + Math.sin(g.bob) * 5;
                ctx.fillStyle = '#10b981';
                ctx.shadowColor = '#34d399';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(g.x + 12, bobY);
                ctx.lineTo(g.x + 22, bobY + 12);
                ctx.lineTo(g.x + 12, bobY + 24);
                ctx.lineTo(g.x + 2, bobY + 12);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Warp Portal
        const p = this.portal;
        ctx.save();
        if (this.portalUnlocked) {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.ellipse(p.x + p.width/2, p.y + p.height/2, p.width/2 + Math.sin(p.pulse) * 4, p.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.ellipse(p.x + p.width/2, p.y + p.height/2, p.width/4, p.height/4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Inactive stone frame
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 6;
            ctx.strokeRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = '#334155';
            ctx.fillRect(p.x + 4, p.y + 4, p.width - 8, p.height - 8);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.gemsCollected}/${this.totalGems}`, p.x + p.width/2, p.y + p.height/2);
        }
        ctx.restore();
    }
}

window.Level1 = Level1;
