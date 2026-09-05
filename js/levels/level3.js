// js/levels/level3.js
// Configuração da Fase 3 (temporariamente duplicada da Fase 2).
// As texturas e formas dos objetos permanecem iguais às da Fase 1.

export const LEVEL3 = {
    duration: 90,
    minScoreWin: 520,
    targetPlanetX: 400,
    targetPlanetFinalY: -450,
    targetPlanetRadius: 600,
    startPlanetFill: '#0d2b1a',
    startPlanetStroke: '#39ff88',
    asteroidChances: { type1: 80, type2: 25, type3: 15 },
    // O planeta de destino da Fase 3 será vermelho.
    timerPlanetFill: '#7a1f2b',
    timerPlanetStroke: '#ff4054'
};

// Na tela inicial da Fase 2, a nave fica sobre o planeta que foi
// encontrado no final da Fase 1. A geometria é mantida igual à do planeta
// de destino original, apenas reposicionada para a composição da tela inicial.
export function drawStartPlanet(ctx) {
    ctx.save();

    // Planeta inicial da Fase 3: verde.
    ctx.fillStyle = '#0d2b1a';
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(400, 1340, 820, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#174d2d';
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
        ? LEVEL3.targetPlanetFinalY
        : targetPlanetY;

    ctx.save();

    // Próximo planeta da Fase 3: vermelho forte, mas não muito escuro.
    ctx.fillStyle = '#5c1722';
    ctx.strokeStyle = '#ff4054';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(LEVEL3.targetPlanetX, planetY, LEVEL3.targetPlanetRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8f2635';
    ctx.beginPath();
    ctx.arc(LEVEL3.targetPlanetX - 180, planetY + 520, 75, 0, Math.PI * 2);
    ctx.arc(LEVEL3.targetPlanetX + 220, planetY + 540, 95, 0, Math.PI * 2);
    ctx.arc(LEVEL3.targetPlanetX, planetY + 565, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
