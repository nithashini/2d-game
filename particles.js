// Particle System for 2D Game Visual FX
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    add(x, y, vx, vy, color, size, life, shape = 'circle', fade = true) {
        this.particles.push({
            x, y, vx, vy, color, size,
            maxLife: life,
            life: life,
            shape: shape,
            fade: fade
        });
    }

    createDust(x, y, count = 4, color = '#cbd5e1') {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
            const speed = Math.random() * 1.5 + 0.5;
            this.add(
                x + (Math.random() - 0.5) * 10,
                y,
                Math.cos(angle) * speed,
                -Math.sin(angle) * speed * 0.4,
                color,
                Math.random() * 3 + 2,
                Math.random() * 15 + 10
            );
        }
    }

    createSparks(x, y, count = 8, color = '#f59e0b') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.add(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                Math.random() * 3 + 1.5,
                Math.random() * 20 + 15
            );
        }
    }

    createThrusterSmoke(x, y, vx = 0, vy = 1) {
        const colors = ['#38bdf8', '#0ea5e9', '#e0f2fe', '#f43f5e'];
        const col = colors[Math.floor(Math.random() * colors.length)];
        this.add(
            x + (Math.random() - 0.5) * 6,
            y,
            vx + (Math.random() - 0.5) * 1.2,
            vy + Math.random() * 2 + 1.5,
            col,
            Math.random() * 4 + 3,
            Math.random() * 14 + 8
        );
    }

    createExplosion(x, y, count = 25, colors = ['#ef4444', '#f97316', '#fbbf24', '#ffffff']) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5;
            const col = colors[Math.floor(Math.random() * colors.length)];
            this.add(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                col,
                Math.random() * 5 + 2,
                Math.random() * 30 + 20,
                'square'
            );
        }
    }

    createConfetti(x, y, count = 40) {
        const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#fbbf24', '#ec4899'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.add(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2,
                colors[Math.floor(Math.random() * colors.length)],
                Math.random() * 5 + 3,
                Math.random() * 60 + 40,
                'square'
            );
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        for (const p of this.particles) {
            const alpha = p.fade ? (p.life / p.maxLife) : 1;
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            ctx.fillStyle = p.color;

            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
                ctx.fill();
            } else {
                const s = p.size * (p.life / p.maxLife);
                ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
            }
        }
        ctx.restore();
    }

    clear() {
        this.particles = [];
    }
}

window.particles = new ParticleSystem();
