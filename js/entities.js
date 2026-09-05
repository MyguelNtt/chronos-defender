// js/entities.js
// Entidades, efeitos e desenhos reutilizáveis do Chronos Defender.

export function createStars(canvas, numStars = 200) {
    const stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 0.5,
            speed: Math.random() * 3 + 1,
            brightness: Math.random() * 0.7 + 0.3
        });
    }
    return stars;
}

export function createMeteor() {
    return { x: -100, y: -100, dx: 0, dy: 0, length: 0, active: false, timer: 0 };
}

export function spawnMeteor(meteor, canvas) {
    meteor.x = Math.random() * canvas.width * 0.8;
    meteor.y = -20;
    meteor.dx = Math.random() * 4 + 4;
    meteor.dy = Math.random() * 3 + 3;
    meteor.length = Math.random() * 80 + 50;
    meteor.active = true;
}

export function createShip(canvas) {
    return {
        x: canvas.width / 2 - 20,
        y: canvas.height - 100,
        width: 40,
        height: 50,
        speed: 6,
        dx: 0,
        dy: 0,
        flameFrame: 0,
        lives: 3,
        maxLives: 3
    };
}

export function createImpactEffect(particles, x, y, isGreen = false, count = 20) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        particles.push({
            x, y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: Math.random() * 4 + 1,
            color: isGreen ? '#00ffcc' : (Math.random() > 0.5 ? '#ffaa00' : '#ff3300'),
            alpha: 1,
            decay: Math.random() * 0.02 + 0.01
        });
    }
}

export function generateAsteroidVertices(baseRadius, numPoints = 8) {
    const vertices = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const r = baseRadius * (0.85 + Math.random() * 0.3);
        vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
}

export function spawnAsteroid(asteroids, canvas, chances = { type1: 80, type2: 15, type3: 5 }) {
    // As chances podem ser pesos e não precisam somar 100.
    // Isso permite configurar a Fase 3 com 80 / 25 / 15 sem eliminar o Met.3.
    const totalChance = chances.type1 + chances.type2 + chances.type3;
    const rand = Math.random() * totalChance;
    const type1Limit = chances.type1;
    const type2Limit = type1Limit + chances.type2;
    let typeConfig;

    if (rand < type1Limit) typeConfig = { type: 1, radius: 13, speed: Math.random() * 1.5 + 2.5 };
    else if (rand < type2Limit) typeConfig = { type: 2, radius: 21, speed: Math.random() * 1.0 + 1.5 };
    else typeConfig = { type: 3, radius: 30, speed: Math.random() * 0.8 + 0.8 };

    const x = Math.random() * (canvas.width - typeConfig.radius * 2 - 100) + typeConfig.radius;

    asteroids.push({
        x,
        y: -typeConfig.radius * 2,
        type: typeConfig.type,
        hp: typeConfig.type === 3 ? 5 : (typeConfig.type === 2 ? 3 : 1),
        radius: typeConfig.radius,
        speed: typeConfig.speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        flameFrame: Math.random() * 10,
        vertices: generateAsteroidVertices(typeConfig.radius)
    });
}

export function spawnDiamond(diamonds, canvas) {
    const size = 12;
    const x = Math.random() * (canvas.width - size * 2 - 100) + size;
    diamonds.push({
        x,
        y: -size * 2,
        size,
        speed: Math.random() * 1.2 + 1.8,
        pulse: Math.random() * Math.PI
    });
}

export function drawMeteor(ctx, meteor) {
    if (!meteor.active) return;

    ctx.save();
    const grad = ctx.createLinearGradient(
        meteor.x, meteor.y,
        meteor.x - meteor.dx * 12, meteor.y - meteor.dy * 12
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(meteor.x - meteor.dx * 15, meteor.y - meteor.dy * 15);
    ctx.stroke();
    ctx.restore();
}

export function drawLandedShip(ctx, x, y, isIgnited) {
    ctx.save();
    ctx.translate(x, y);

    if (isIgnited) {
        const flameH = 35 + Math.random() * 22;

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-14, 40);
        ctx.lineTo(0, 40 + flameH);
        ctx.lineTo(14, 40);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffff55';
        ctx.beginPath();
        ctx.moveTo(-7, 40);
        ctx.lineTo(0, 40 + flameH * 0.6);
        ctx.lineTo(7, 40);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(-34, 34);
    ctx.lineTo(-16, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#357abd';
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(34, 34);
    ctx.lineTo(16, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(-16, 34);
    ctx.lineTo(16, 34);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#112233';
    ctx.beginPath();
    ctx.ellipse(0, -8, 8, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 0);
    ctx.moveTo(-4, -8);
    ctx.lineTo(4, -8);
    ctx.stroke();

    ctx.restore();
}

export function drawShip(ctx, ship, keys, isShipExiting, gameState) {
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);

    let tilt = 0;
    if (!isShipExiting && gameState !== 'PAUSED') {
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) tilt = -0.15;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) tilt = 0.15;
    }
    ctx.rotate(tilt);

    const flameHeight = 15 + Math.sin(ship.flameFrame) * 6;

    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(-8, ship.height / 2);
    ctx.lineTo(0, ship.height / 2 + flameHeight);
    ctx.lineTo(8, ship.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffff55';
    ctx.beginPath();
    ctx.moveTo(-4, ship.height / 2);
    ctx.lineTo(0, ship.height / 2 + flameHeight * 0.6);
    ctx.lineTo(4, ship.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.moveTo(0, -ship.height / 2);
    ctx.lineTo(-ship.width / 2, ship.height / 2 - 5);
    ctx.lineTo(-10, ship.height / 2 - 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#357abd';
    ctx.beginPath();
    ctx.moveTo(0, -ship.height / 2);
    ctx.lineTo(ship.width / 2, ship.height / 2 - 5);
    ctx.lineTo(10, ship.height / 2 - 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(0, -ship.height / 2 - 5);
    ctx.lineTo(-10, ship.height / 2 - 5);
    ctx.lineTo(10, ship.height / 2 - 5);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 10;
    ctx.shadowColor = ship.lives > 0 ? '#00ffff' : '#444';
    ctx.fillStyle = '#112233';
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ship.lives > 0 ? '#00ffff' : '#555555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, 3);
    ctx.moveTo(-3, -5);
    ctx.lineTo(3, -5);
    ctx.stroke();

    ctx.restore();
}

export function drawAsteroid(ctx, ast) {
    ctx.save();
    ctx.translate(ast.x, ast.y);

    const flameLen = (ast.radius * 0.5) + Math.sin(ast.flameFrame) * (ast.radius * 0.15);
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(-ast.radius * 0.4, -ast.radius * 0.7);
    ctx.lineTo(0, -ast.radius - flameLen);
    ctx.lineTo(ast.radius * 0.4, -ast.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.rotate(ast.rotation);

    ctx.fillStyle = '#5c5c6b';
    ctx.strokeStyle = '#383842';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(ast.vertices[0].x, ast.vertices[0].y);
    for (let i = 1; i < ast.vertices.length; i++) {
        ctx.lineTo(ast.vertices[i].x, ast.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

export function drawDiamond(ctx, d) {
    ctx.save();
    ctx.translate(d.x, d.y);

    ctx.shadowBlur = 8 + Math.sin(d.pulse) * 4;
    ctx.shadowColor = '#00ffcc';

    ctx.fillStyle = '#00ffcc';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, -d.size);
    ctx.lineTo(d.size * 0.8, 0);
    ctx.lineTo(0, d.size);
    ctx.lineTo(-d.size * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

export function drawParticles(ctx, particles) {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export function updateParticles(particles) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}
