// js/levels/level2.js
// Configuração exclusiva da Fase 2.
// As texturas e formas dos objetos permanecem iguais às da Fase 1.

export const LEVEL2 = {
    duration: 90,
    minScoreWin: 500,
    targetPlanetX: 400,
    targetPlanetFinalY: -450,
    targetPlanetRadius: 600,
    startPlanetFill: '#1a0d2b',
    startPlanetStroke: '#00ffff',
    asteroidChances: { type1: 70, type2: 20, type3: 10 },
    timerPlanetFill: '#1b5e3a',
    timerPlanetStroke: '#39ff88'
};

// Na tela inicial da Fase 2, a nave fica sobre o planeta que foi
// encontrado no final da Fase 1. A geometria é mantida igual à do planeta
// de destino original, apenas reposicionada para a composição da tela inicial.
export function drawStartPlanet(ctx) {
    ctx.save();

    ctx.fillStyle = '#1a0d2b';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(400, 1340, 820, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#26133d';
    ctx.beginPath();
    ctx.arc(300, 530, 50, 0, Math.PI * 2);
    ctx.arc(570, 550, 80, 0, Math.PI * 2);
    ctx.arc(160, 560, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function drawTargetPlanet(ctx, gameState, targetPlanetY) {
    const lockedWithoutWeapon = !gameState.plasmaWeaponPickedUp;

    // Sem a Arma de Plasma, o planeta verde NÃO fica visível durante a fase.
    // Ele só entra na cena quando chega o momento em que o planeta de destino
    // normalmente desceria. Nesse caso, ele desce no mesmo percurso, mas é
    // apenas um elemento visual com hitbox e nunca conclui a fase.
    if (!gameState.isTargetPlanetDescending && gameState.gameState !== 'OBSERVING_CUTSCENE') {
        return;
    }

    const planetY = gameState.gameState === 'OBSERVING_CUTSCENE'
        ? LEVEL2.targetPlanetFinalY
        : targetPlanetY;

    ctx.save();

    // Mesma textura/forma da Fase 1, somente com a cor verde solicitada.
    ctx.fillStyle = '#0d2b1a';
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(LEVEL2.targetPlanetX, planetY, LEVEL2.targetPlanetRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#174d2d';
    ctx.beginPath();
    ctx.arc(LEVEL2.targetPlanetX - 180, planetY + 520, 75, 0, Math.PI * 2);
    ctx.arc(LEVEL2.targetPlanetX + 220, planetY + 540, 95, 0, Math.PI * 2);
    ctx.arc(LEVEL2.targetPlanetX, planetY + 565, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
