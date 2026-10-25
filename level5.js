// Level 5: The Cyber Core - NEXUS-9 Boss Battle
// Mechanics: Arena Shooter, Blaster Cannon, Multi-phase Boss with bullet patterns, orbital shields, enrage mode
class Level5 {
    constructor() {
        this.name = "Level 5: The Cyber Core";
        this.description = "Final Showdown! Destroy the Cyber Overlord NEXUS-9 with your Blaster (Press Space / Z / Click to Shoot)!";
        this.mode = "cyber";
        this.width = 1200; // Contained epic arena
        this.height = 650;
        this.playerStart = { x: 120, y: 480 };

        this.bossDefeated = false;
        this.victoryTimer = 0;

        this.init();
    }

    init() {
        // Arena Platforms
        this.platforms = [
            // Floor
            { x: 0, y: 560, width: 1200, height: 90, color: '#0f172a' },
            // Left platform
            { x: 80, y: 420, width: 180, height: 22, color: '#1e293b' },
            { x: 80, y: 260, width: 180, height: 22, color: '#1e293b' },
            // Right platform
            { x: 940, y: 420, width: 180, height: 22, color: '#1e293b' },
            { x: 940, y: 260, width: 180, height: 22, color: '#1e293b' },
            // Center high bridge
            { x: 450, y: 340, width: 300, height: 22, color: '#1e293b' }
        ];

        // Boss: NEXUS-9
        this.boss = {
            x: 750,
            y: 220,
            width: 90,
            height: 90,
            hp: 100,
            maxHp: 100,
            phase: 1, // 1, 2, or 3
            hoverAngle: 0,
            attackTimer: 0,
            shieldAngle: 0,
            hasShield: false,
            invulnerableTime: 0,
            bullets: [],
            minions: [],
            dashState: 'none', // 'windup', 'dashing', 'recovering'
            dashTimer: 0,
            dashTargetX: 0
        };
    }

    update(player) {
        const b = this.boss;

        // If boss already defeated
        if (this.bossDefeated) {
            this.victoryTimer++;
            if (this.victoryTimer === 1) {
                window.sounds.playLevelComplete();
            }
            if (this.victoryTimer % 15 === 0 && this.victoryTimer < 180) {
                window.particles.createConfetti(
                    b.x + (Math.random() - 0.5) * 150,
                    b.y + (Math.random() - 0.5) * 150,
                    25
                );
            }
            if (this.victoryTimer > 200) {
                return { complete: true, gameWon: true };
            }
            return null;
        }

        // Determine Boss Phase
        if (b.hp <= 35) {
            b.phase = 3; // Enrage phase
            b.hasShield = false;
        } else if (b.hp <= 70) {
            b.phase = 2; // Shield & Drone phase
            b.hasShield = true;
        } else {
            b.phase = 1; // Standard bullet rings
            b.hasShield = false;
        }

        // Boss Floating Movement
        b.hoverAngle += (b.phase === 3 ? 0.07 : 0.04);
        b.y = 210 + Math.sin(b.hoverAngle) * (b.phase === 3 ? 90 : 60);

        if (b.phase === 3) {
            // Sway left-right aggressively
            b.x = 600 + Math.cos(b.hoverAngle * 0.7) * 320;
        } else {
            b.x = 750 + Math.cos(b.hoverAngle * 0.5) * 120;
        }

        // Shield Rotation
        if (b.hasShield) {
            b.shieldAngle += 0.05;
        }

        // Boss Attack Patterns
        b.attackTimer++;

        // Phase 1 Attacks: Spiral Bullet Ring every 90 frames
        if (b.phase === 1 && b.attackTimer % 90 === 0) {
            const numBullets = 8;
            for (let i = 0; i < numBullets; i++) {
                const angle = (Math.PI * 2 / numBullets) * i + (b.attackTimer * 0.05);
                b.bullets.push({
                    x: b.x + b.width / 2,
                    y: b.y + b.height / 2,
                    vx: Math.cos(angle) * 3.8,
                    vy: Math.sin(angle) * 3.8,
                    radius: 7,
                    color: '#06b6d4'
                });
            }
            window.sounds.playShoot();
        }

        // Phase 2 Attacks: Targeted Triple Burst + Minions
        if (b.phase === 2) {
            if (b.attackTimer % 75 === 0) {
                const angleToPlayer = Math.atan2(
                    (player.y + player.height / 2) - (b.y + b.height / 2),
                    (player.x + player.width / 2) - (b.x + b.width / 2)
                );
                [-0.2, 0, 0.2].forEach(offset => {
                    b.bullets.push({
                        x: b.x + b.width / 2,
                        y: b.y + b.height / 2,
                        vx: Math.cos(angleToPlayer + offset) * 4.6,
                        vy: Math.sin(angleToPlayer + offset) * 4.6,
                        radius: 8,
                        color: '#f59e0b'
                    });
                });
                window.sounds.playShoot();
            }

            // Spawn Mini Drones if under 2
            if (b.minions.length < 2 && b.attackTimer % 220 === 0) {
                b.minions.push({
                    x: b.x + (Math.random() - 0.5) * 80,
                    y: b.y - 40,
                    vx: 2.2,
                    hp: 3
                });
            }
        }

        // Phase 3 Attacks: Rapid Starburst + Laser Sweeps
        if (b.phase === 3) {
            if (b.attackTimer % 40 === 0) {
                const num = 12;
                for (let i = 0; i < num; i++) {
                    const angle = (Math.PI * 2 / num) * i;
                    b.bullets.push({
                        x: b.x + b.width / 2,
                        y: b.y + b.height / 2,
                        vx: Math.cos(angle) * 5.2,
                        vy: Math.sin(angle) * 5.2,
                        radius: 9,
                        color: '#ef4444'
                    });
                }
                window.sounds.playAlert();
            }
        }

        // Update Boss Bullets
        for (let i = b.bullets.length - 1; i >= 0; i--) {
            const bl = b.bullets[i];
            bl.x += bl.vx;
            bl.y += bl.vy;

            // Collide with Player
            if (Math.hypot(player.x + player.width/2 - bl.x, player.y + player.height/2 - bl.y) < bl.radius + 12) {
                player.takeDamage(1);
                b.bullets.splice(i, 1);
                continue;
            }

            // Remove if off arena
            if (bl.x < -50 || bl.x > this.width + 50 || bl.y < -50 || bl.y > this.height + 50) {
                b.bullets.splice(i, 1);
            }
        }

        // Update Boss Minions
        for (let i = b.minions.length - 1; i >= 0; i--) {
            const m = b.minions[i];
            const dx = (player.x + player.width/2) - m.x;
            const dy = (player.y + player.height/2) - m.y;
            const dist = Math.hypot(dx, dy);

            m.x += (dx / dist) * 1.8;
            m.y += (dy / dist) * 1.8;

            // Damage player
            if (dist < 22) {
                player.takeDamage(1);
            }

            // Hit by player bullets
            for (let j = player.bullets.length - 1; j >= 0; j--) {
                const pb = player.bullets[j];
                if (Math.hypot(pb.x - m.x, pb.y - m.y) < 20) {
                    player.bullets.splice(j, 1);
                    m.hp--;
                    window.particles.createSparks(m.x, m.y, 8, '#38bdf8');
                    if (m.hp <= 0) {
                        window.sounds.playExplosion();
                        window.particles.createExplosion(m.x, m.y, 16);
                        b.minions.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Check Player Bullets hitting Boss
        for (let i = player.bullets.length - 1; i >= 0; i--) {
            const pb = player.bullets[i];

            // If Boss has shield, check orbital shield deflection
            if (b.hasShield) {
                const s1x = b.x + b.width/2 + Math.cos(b.shieldAngle) * 75;
                const s1y = b.y + b.height/2 + Math.sin(b.shieldAngle) * 75;
                const s2x = b.x + b.width/2 + Math.cos(b.shieldAngle + Math.PI) * 75;
                const s2y = b.y + b.height/2 + Math.sin(b.shieldAngle + Math.PI) * 75;

                if (Math.hypot(pb.x - s1x, pb.y - s1y) < 24 || Math.hypot(pb.x - s2x, pb.y - s2y) < 24) {
                    // Deflected!
                    player.bullets.splice(i, 1);
                    window.sounds.playBounce();
                    window.particles.createSparks(pb.x, pb.y, 10, '#38bdf8');
                    continue;
                }
            }

            // Hit Boss Body (AABB)
            if (pb.x + pb.width > b.x && pb.x < b.x + b.width &&
                pb.y + pb.height > b.y && pb.y < b.y + b.height) {
                player.bullets.splice(i, 1);
                b.hp -= 3;
                b.invulnerableTime = 8;
                window.sounds.playHit();
                window.particles.createSparks(pb.x, pb.y, 12, (b.phase === 3 ? '#ef4444' : '#00f0ff'));

                if (b.hp <= 0) {
                    b.hp = 0;
                    this.bossDefeated = true;
                    window.sounds.playExplosion();
                    window.particles.createExplosion(b.x + b.width/2, b.y + b.height/2, 60);
                }
            }
        }

        if (b.invulnerableTime > 0) b.invulnerableTime--;

        return null;
    }

    render(ctx, camera) {
        // High-tech Cyber Grid Arena
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, this.width, this.height);

        // Cyber Grid Lines
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Platforms
        for (const p of this.platforms) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Glowing neon top rim
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x, p.y, p.width, 3);
            ctx.shadowBlur = 0;
        }

        const b = this.boss;

        // Render Boss Bullets
        for (const bl of b.bullets) {
            ctx.fillStyle = bl.color;
            ctx.shadowColor = bl.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(bl.x, bl.y, bl.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Render Boss Minions
        for (const m of b.minions) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(m.x - 3, m.y - 3, 6, 6);
        }

        // Render NEXUS-9 Boss
        if (!this.bossDefeated || this.victoryTimer < 180) {
            ctx.save();
            ctx.translate(b.x + b.width / 2, b.y + b.height / 2);

            // Flicker on hit
            if (b.invulnerableTime > 0) {
                ctx.globalAlpha = 0.6;
            }

            // Orbital Shield Spheres (Phase 2)
            if (b.hasShield) {
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 75, 0, Math.PI * 2);
                ctx.stroke();

                [-b.shieldAngle, b.shieldAngle + Math.PI].forEach(ang => {
                    const sx = Math.cos(ang) * 75;
                    const sy = Math.sin(ang) * 75;
                    ctx.fillStyle = '#38bdf8';
                    ctx.shadowColor = '#38bdf8';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
            }

            // Boss Outer Chassis
            const coreColor = (b.phase === 3 ? '#ef4444' : (b.phase === 2 ? '#f59e0b' : '#00f0ff'));
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = coreColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = coreColor;
            ctx.shadowBlur = (b.phase === 3 ? 24 : 14);

            // Hexagonal Chassis Body
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = Math.cos(angle) * (b.width / 2);
                const py = Math.sin(angle) * (b.height / 2);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pulsing Cyber Core
            const pulse = Math.sin(b.hoverAngle * 3) * 4;
            ctx.fillStyle = coreColor;
            ctx.beginPath();
            ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
            ctx.fill();

            // Core pupil
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Boss Health Bar HUD pinned to screen viewport
        ctx.save();
        const barWidth = 400;
        const barHeight = 16;
        const screenCenterX = camera ? camera.x + camera.width / 2 : this.width / 2;
        const barX = screenCenterX - barWidth / 2;
        const barY = (camera ? camera.y : 0) + 24;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8);

        // Fill
        const hpPct = Math.max(0, b.hp / b.maxHp);
        const barCol = (b.phase === 3 ? '#ef4444' : (b.phase === 2 ? '#f59e0b' : '#00f0ff'));
        ctx.fillStyle = barCol;
        ctx.shadowColor = barCol;
        ctx.shadowBlur = 10;
        ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            `NEXUS-9 CORE (PHASE ${b.phase}/3) - ${Math.ceil(b.hp)}%`,
            screenCenterX,
            barY + 12
        );
        ctx.restore();

        // Victory banner if won
        if (this.bossDefeated) {
            ctx.save();
            const bannerY = (camera ? camera.y : 0) + 180;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillRect((camera ? camera.x : 0), bannerY, (camera ? camera.width : this.width), 160);
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 38px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("OVERLORD DESTROYED!", screenCenterX, bannerY + 70);
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px sans-serif';
            ctx.fillText("All 5 Worlds Restored to Harmony!", screenCenterX, bannerY + 115);
            ctx.restore();
        }
    }
}

window.Level5 = Level5;
