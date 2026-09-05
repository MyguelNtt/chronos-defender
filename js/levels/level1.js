// js/levels/level1.js
// Configuração e elementos exclusivos da Fase 1.

export const LEVEL1 = {
    duration: 90,
    minScoreWin: 450,
    targetPlanetX: 400,
    targetPlanetFinalY: -450,
    targetPlanetRadius: 600,
    startPlanetFill: '#11112b',
    startPlanetStroke: '#2d2d69'
};

export function drawPlanet(ctx) {
    ctx.save();

    ctx.fillStyle = '#11112b';
    ctx.strokeStyle = '#2d2d69';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(400, 1340, 820, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1a1a3d';
    ctx.beginPath();
    ctx.arc(300, 530, 50, 0, Math.PI * 2);
    ctx.arc(570, 550, 80, 0, Math.PI * 2);
    ctx.arc(160, 560, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function drawTargetPlanet(ctx, gameState, targetPlanetY) {
    if (!gameState.isTargetPlanetDescending && gameState.gameState !== 'OBSERVING_CUTSCENE') return;

    const planetY = gameState.gameState === 'OBSERVING_CUTSCENE'
        ? LEVEL1.targetPlanetFinalY
        : targetPlanetY;

    ctx.save();

    ctx.fillStyle = '#1a0d2b';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(LEVEL1.targetPlanetX, planetY, LEVEL1.targetPlanetRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#26133d';
    ctx.beginPath();
    ctx.arc(LEVEL1.targetPlanetX - 180, planetY + 520, 75, 0, Math.PI * 2);
    ctx.arc(LEVEL1.targetPlanetX + 220, planetY + 540, 95, 0, Math.PI * 2);
    ctx.arc(LEVEL1.targetPlanetX, planetY + 565, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
