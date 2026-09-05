// js/game.js
// Núcleo do jogo e gerenciamento da Fase 1.

import {
    createStars,
    createMeteor,
    spawnMeteor,
    createShip,
    createImpactEffect,
    spawnAsteroid,
    spawnDiamond,
    drawMeteor,
    drawLandedShip,
    drawShip,
    drawAsteroid,
    drawDiamond,
    drawParticles,
    updateParticles
} from './entities.js';

import { LEVEL1, drawPlanet as drawPlanetLevel1, drawTargetPlanet as drawTargetPlanetLevel1 } from './levels/level1.js';
import { LEVEL2, drawTargetPlanet as drawTargetPlanetLevel2, drawStartPlanet as drawStartPlanetLevel2 } from './levels/level2.js';
import { LEVEL3, drawTargetPlanet as drawTargetPlanetLevel3, drawStartPlanet as drawStartPlanetLevel3 } from './levels/level3.js';

const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const startTitle = document.getElementById('start-title');
const startBtn = document.getElementById('start-btn');

const gameoverScreen = document.getElementById('gameover-screen');
const gameoverScoreElem = document.getElementById('gameover-animated-score');
const gameoverMsg = document.getElementById('gameover-msg');
const gameoverBtns = document.getElementById('gameover-btns');

const levelEndScreen = document.getElementById('level-end-screen');
const statusHeaderTitle = document.getElementById('status-header-title');
const statusBodyText = document.getElementById('status-body-text');
const levelStatusMsg = document.getElementById('level-status-msg');
const animatedScoreElem = document.getElementById('animated-score');
const levelBtns = document.getElementById('level-btns');
const levelNextBtn = document.getElementById('level-next-btn');
const levelHomeBtn = document.getElementById('level-home-btn');

const destructionScreen = document.getElementById('destruction-screen');
const destructionContent = document.getElementById('destruction-content');

const screenOverlay = document.getElementById('screen-overlay');
const objectiveScreen = document.getElementById('objective-screen');

const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');
const testUnlockScreen = document.getElementById('test-unlock-screen');

let gameState = 'START';
let currentLevel = 1;
const LEVEL_CONFIG = { 1: LEVEL1, 2: LEVEL2, 3: LEVEL3 };
const startPlanetDrawers = { 1: drawPlanetLevel1, 2: drawStartPlanetLevel2, 3: drawStartPlanetLevel3 };
const targetPlanetDrawers = { 1: drawTargetPlanetLevel1, 2: drawTargetPlanetLevel2, 3: drawTargetPlanetLevel3 };
const LEVEL2_UNLOCK_KEY = 'chronosDefenderLevel2Unlocked_v3';
const LEVEL3_UNLOCK_KEY = 'chronosDefenderLevel3Unlocked_v1';
const LEVEL3_COMPLETED_KEY = 'chronosDefenderLevel3Completed_v1';
let level2Unlocked = localStorage.getItem(LEVEL2_UNLOCK_KEY) === 'true';
let level3Unlocked = localStorage.getItem(LEVEL3_UNLOCK_KEY) === 'true';
let level3Completed = localStorage.getItem(LEVEL3_COMPLETED_KEY) === 'true';

let objectiveTimeout = null;
let objectiveSequenceStep = 1;

let shakeIntensity = 0;
let landShipX = 400;
let landShipY = 480;
let landShipSpeed = 0;
let landShipAccel = 0;
let isEngineIgnited = false;
let isLiftoffStarted = false;
let fadeTriggered = false;

let stageTimer = getCurrentDuration();
let stageInterval = null;
let score = 0;
let scoreAnimationInterval = null;

let targetPlanetY = getCurrentLevelConfig().targetPlanetStartY ?? -900;
let isTargetPlanetDescending = false;

let isShipExiting = false;
const shipExitSpeed = 8;

let destructionShipY = 650;
let destructionShipSpeed = 0;
let isDestructionShipExploded = false;

// Fase 3: evento do alienígena e Arma de Plasma.
const PLASMA_WEAPON_KEY = 'chronosDefenderPlasmaWeaponUnlocked_v1';
let plasmaWeaponUnlocked = localStorage.getItem(PLASMA_WEAPON_KEY) === 'true';
let plasmaWeaponPickedUp = false;
let plasmaWeaponEventTriggered = false;
let plasmaWeapon = null;
let alienUfo = null;
let plasmaAmmo = 0;
const PLASMA_MAX_AMMO = 10;
const PLASMA_RECHARGE_CHANCE = 0.115;
let plasmaCharger = null;
let plasmaChargerSpawnTimer = 0;
let plasmaWeaponDropReady = false;
let plasmaWeaponDropComplete = false;
let planetWeaponWarningUntil = 0;

// Projéteis da Arma de Plasma.
const plasmaShots = [];
let plasmaShotCooldown = 0;
const PLASMA_SHOTS_PER_SECOND = 7;
const PLASMA_SHOT_INTERVAL = 1000 / PLASMA_SHOTS_PER_SECOND;

const stars = createStars(canvas);
const meteor = createMeteor();
const ship = createShip(canvas);
const particles = [];
const asteroids = [];
const diamonds = [];

const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // CTRL + E = abrir o menu de testes/desbloqueios.
    if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        unlockAllProgressForTesting();
        return;
    }

    if ((e.key === ' ' || e.key === 'Spacebar') && gameState === 'OBJECTIVE_PAUSE') {
        e.preventDefault();
        skipObjectiveScreen();
        return;
    }

    if ((e.key === 'Escape' || e.key === 'Esc') && gameState === 'PLAYING') {
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

objectiveScreen.addEventListener('click', () => {
    if (gameState === 'OBJECTIVE_PAUSE') {
        skipObjectiveScreen();
    }
});

function skipObjectiveScreen() {
    if (gameState !== 'OBJECTIVE_PAUSE') return;

    if (objectiveTimeout) clearTimeout(objectiveTimeout);

    objectiveScreen.classList.remove('visible');

    // Na Fase 3, o primeiro aviso de objetivo é seguido pelo tutorial da
    // Arma de Plasma usando exatamente o mesmo sistema de aviso.
    if (currentLevel === 3 && objectiveSequenceStep === 1) {
        objectiveSequenceStep = 2;
        // O segundo aviso entra 0,5s DEPOIS que o primeiro terminou/pulou.
        setTimeout(() => showSecondPhase3Objective(), 500);
        return;
    }

    setTimeout(() => {
        startGamePlay();
    }, 300);
}

function drawObjectiveWeaponIcon() {
    const iconCanvas = document.getElementById('objective-weapon-icon');
    if (!iconCanvas) return;

    const iconCtx = iconCanvas.getContext('2d');
    iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
    drawPlasmaWeaponIcon(iconCtx, iconCanvas.width / 2, 32, 0.9);
}

function showSecondPhase3Objective() {
    if (currentLevel !== 3) {
        startGamePlay();
        return;
    }

    gameState = 'OBJECTIVE_PAUSE';
    pauseBtn.classList.add('hidden');

    const objectiveTitle = document.querySelector('.objective-title');
    const objectiveText = document.querySelector('.objective-text');
    const objectiveTarget = document.getElementById('objective-target');

    if (objectiveTitle) objectiveTitle.textContent = 'TUTORIAL DA ARMA DE PLASMA';
    drawObjectiveWeaponIcon();
    if (objectiveText) {
        objectiveText.innerHTML =
            'Segure <strong>ESPAÇO</strong> para disparar a Arma de Plasma.<br>' +
            'A arma começa com <span id="objective-target" class="objective-target">10 DISPAROS</span>.<br>' +
            'Use os disparos para destruir os asteroides e abrir caminho!';
    }

    objectiveScreen.classList.add('phase3-objective-texture');
    objectiveScreen.classList.add('weapon-tutorial-texture');
    objectiveScreen.classList.add('visible');

    // O sistema continua sendo exatamente o mesmo aviso de objetivo.
    // Depois de 3,8s ele pode ser pulado e a fase começa normalmente.
    objectiveTimeout = setTimeout(() => {
        if (gameState === 'OBJECTIVE_PAUSE') {
            skipObjectiveScreen();
        }
    }, 3800);
}

function showWeaponPickupObjective() {
    // O aviso da coleta usa a MESMA tela/sistema de objetivo.
    // Ele substitui o antigo aviso de "arma desbloqueada".
    if (currentLevel !== 2 || gameState !== 'PLAYING') return;

    if (objectiveTimeout) clearTimeout(objectiveTimeout);

    gameState = 'OBJECTIVE_PAUSE';
    pauseBtn.classList.add('hidden');

    const objectiveTitle = document.querySelector('.objective-title');
    const objectiveText = document.querySelector('.objective-text');

    if (objectiveTitle) objectiveTitle.textContent = 'ARMA DE PLASMA DESBLOQUEADA';
    drawObjectiveWeaponIcon();
    if (objectiveText) {
        objectiveText.innerHTML =
            'Você pegou a <strong>ARMA DE PLASMA</strong>!<br>' +
            'Ela será usada a partir da Fase 3.<br>' +
            'Na Fase 3, segure <strong>ESPAÇO</strong> para disparar.';
    }

    objectiveScreen.classList.remove('phase3-objective-texture');
    objectiveScreen.classList.add('weapon-tutorial-texture');
    objectiveScreen.classList.add('visible');

    objectiveTimeout = setTimeout(() => {
        if (gameState === 'OBJECTIVE_PAUSE') {
            skipObjectiveScreen();
        }
    }, 3800);
}

function togglePause() {
    if (gameState === 'PLAYING') {
        pauseGame();
    } else if (gameState === 'PAUSED') {
        resumeGame();
    }
}

function pauseGame() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseScreen.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    }
}

function resumeGame() {
    if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseScreen.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
    }
}

function restartGameFromPause() {
    pauseScreen.classList.add('hidden');
    restartGameWithFade();
}

function goToNextLevel() {
    if (currentLevel === 1) {
        level2Unlocked = true;
        localStorage.setItem(LEVEL2_UNLOCK_KEY, 'true');
        updateLevelSelectUI();

        currentLevel = 2;
        resetStageValues();
        startLevelWithFadeAndObjective();
        return;
    }

    if (currentLevel === 2) {
        level3Unlocked = true;
        localStorage.setItem(LEVEL3_UNLOCK_KEY, 'true');
        updateLevelSelectUI();

        currentLevel = 3;
        resetStageValues();
        startLevelWithFadeAndObjective();
    }
}

function goToHomeFromPause() {
    pauseScreen.classList.add('hidden');
    goToHomeWithFade();
}

function getCurrentLevelConfig() {
    return LEVEL_CONFIG[currentLevel] || LEVEL1;
}

document.getElementById('level-select-close-btn')?.addEventListener('click', closeLevelSelector);

function openLevelSelector() {
    const screen = document.getElementById('level-select-screen');
    if (!screen) return;
    updateLevelSelectUI();
    document.getElementById('start-screen').classList.add('hidden');
    screen.classList.remove('hidden');
}

function closeLevelSelector() {
    const screen = document.getElementById('level-select-screen');
    if (!screen) return;
    screen.classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
}

function updateLevelSelectUI() {
    const btn2 = document.getElementById('level2-select-btn');
    const btn3 = document.getElementById('level3-select-btn');

    if (btn2) {
        btn2.disabled = !level2Unlocked;
        btn2.textContent = level2Unlocked ? 'FASE 2' : 'FASE 2 🔒';
    }

    if (btn3) {
        btn3.disabled = !level3Unlocked;
        btn3.textContent = level3Unlocked ? 'FASE 3' : 'FASE 3 🔒';
    }
}


function selectLevel(level) {
    if (level === 2 && !level2Unlocked) return;
    if (level === 3 && !level3Unlocked) return;

    currentLevel = level;
    resetStageValues();

    // Escolher uma fase NÃO inicia a partida. Apenas prepara a tela inicial
    // para a fase escolhida e deixa o botão COMEÇAR fazer o início normal.
    startTitle.classList.remove('fade-out');
    startBtn.classList.remove('fade-out');
    const levelSelectBtn = document.getElementById('level-select-btn');
    if (levelSelectBtn) levelSelectBtn.classList.remove('fade-out');

    isEngineIgnited = false;
    isLiftoffStarted = false;
    shakeIntensity = 0;
    landShipY = 480;
    landShipSpeed = 0;
    landShipAccel = 0;
    fadeTriggered = false;

    closeLevelSelector();
}

function getCurrentDuration() {
    return getCurrentLevelConfig().duration;
}

function getCurrentMinScore() {
    return getCurrentLevelConfig().minScoreWin;
}

function resetStageValues() {
    ship.lives = ship.maxLives;
    ship.x = canvas.width / 2 - 20;
    ship.y = canvas.height - 100;

    asteroids.length = 0;
    diamonds.length = 0;
    particles.length = 0;

    score = 0;
    stageTimer = getCurrentDuration();
    targetPlanetY = getCurrentLevelConfig().targetPlanetStartY ?? -900;
    isTargetPlanetDescending = false;
    isShipExiting = false;
    fadeTriggered = false;
    // A Fase 3 sempre começa com a Arma de Plasma, independentemente de ela
    // ter sido coletada/conquistada na Fase 2.
    plasmaWeaponPickedUp = currentLevel >= 3;
    planetWeaponWarningUntil = 0;
    plasmaWeaponEventTriggered = false;
    plasmaWeapon = null;
    alienUfo = null;
    plasmaShots.length = 0;
    plasmaShotCooldown = 0;
    plasmaAmmo = currentLevel >= 3 ? PLASMA_MAX_AMMO : 0;
    plasmaCharger = null;
    plasmaChargerSpawnTimer = 0;
    plasmaWeaponDropReady = false;
    plasmaWeaponDropComplete = false;
    spawnTimer = 0;
    diamondSpawnTimer = 0;

    if (stageInterval) clearInterval(stageInterval);
    if (scoreAnimationInterval) clearInterval(scoreAnimationInterval);
    if (objectiveTimeout) clearTimeout(objectiveTimeout);
    objectiveSequenceStep = 1;
}

function startIntroSequence() {
    gameState = 'INTRO';
    pauseBtn.classList.add('hidden');
    fadeTriggered = false;

    startTitle.classList.add('fade-out');
    startBtn.classList.add('fade-out');
    const levelSelectBtn = document.getElementById('level-select-btn');
    if (levelSelectBtn) levelSelectBtn.classList.add('fade-out');

    setTimeout(() => {
        isEngineIgnited = true;
        shakeIntensity = 4.5;

        setTimeout(() => {
            isLiftoffStarted = true;
            landShipSpeed = 0.2;
            landShipAccel = 0.12;
        }, 3000);

    }, 3500);
}

function triggerGameTransition() {
    screenOverlay.style.opacity = '1';

    setTimeout(() => {
        startScreen.classList.add('hidden');
        startTitle.classList.remove('fade-out');
        startBtn.classList.remove('fade-out');
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) levelSelectBtn.classList.remove('fade-out');
        screenOverlay.style.opacity = '0';

        isEngineIgnited = false;
        isLiftoffStarted = false;
        shakeIntensity = 0;
        landShipY = 480;
        landShipSpeed = 0;
        landShipAccel = 0;

        prepareGameWithObjective();
    }, 2000);
}

function prepareGameWithObjective() {
    resetStageValues();

    gameState = 'OBJECTIVE_PAUSE';
    pauseBtn.classList.add('hidden');
    objectiveSequenceStep = 1;

    gameoverScreen.classList.add('hidden');
    levelEndScreen.classList.add('hidden');
    destructionScreen.classList.add('hidden');
    destructionContent.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    destructionScreen.style.background = 'transparent';

    const objectiveTitle = document.querySelector('.objective-title');
    const objectiveText = document.querySelector('.objective-text');
    const objectiveTarget = document.getElementById('objective-target');

    if (objectiveTitle) objectiveTitle.textContent = 'OBJETIVO DA MISSÃO';
    if (objectiveText) {
        objectiveText.innerHTML =
            `Colete no mínimo <span id="objective-target" class="objective-target">${getCurrentMinScore()} DIAMANTES ESPACIAIS</span><br>` +
            'para estabilizar o salto e completar a jornada!';
    } else if (objectiveTarget) {
        objectiveTarget.textContent = `${getCurrentMinScore()} DIAMANTES ESPACIAIS`;
    }

    objectiveScreen.classList.remove('weapon-tutorial-texture');
    objectiveScreen.classList.toggle('phase3-objective-texture', currentLevel === 3);
    objectiveScreen.classList.add('visible');

    // O próprio cronômetro avança a sequência. Isso é importante porque,
    // quando o primeiro aviso some sozinho, ele também precisa disparar o
    // segundo aviso da Fase 3.
    objectiveTimeout = setTimeout(() => {
        if (gameState === 'OBJECTIVE_PAUSE') {
            skipObjectiveScreen();
        }
    }, 3800);
}

function startGamePlay() {
    gameState = 'PLAYING';
    pauseBtn.classList.remove('hidden');

    if (stageInterval) clearInterval(stageInterval);

    stageInterval = setInterval(() => {
        if (gameState === 'PLAYING') {
            stageTimer--;

            // O Alien entrega a Arma de Plasma somente na Fase 2,
            // quando faltarem exatamente 30 segundos.
            if (currentLevel === 2 && stageTimer === 30) {
                triggerPlasmaWeaponEvent();
            }

            if (stageTimer <= 0) {
                clearInterval(stageInterval);
            }
        }
    }, 1000);

}

function startLevelWithFadeAndObjective() {
    pauseBtn.classList.add('hidden');
    screenOverlay.style.opacity = '1';

    setTimeout(() => {
        startTitle.classList.remove('fade-out');
        startBtn.classList.remove('fade-out');
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) levelSelectBtn.classList.remove('fade-out');

        isEngineIgnited = false;
        isLiftoffStarted = false;
        shakeIntensity = 0;
        landShipY = 480;
        landShipSpeed = 0;
        landShipAccel = 0;

        startScreen.classList.add('hidden');
        screenOverlay.style.opacity = '0';
        prepareGameWithObjective();
    }, 2000);
}

function restartGameWithFade() {
    pauseBtn.classList.add('hidden');
    screenOverlay.style.opacity = '1';

    setTimeout(() => {
        screenOverlay.style.opacity = '0';
        prepareGameWithObjective();
    }, 2000);
}

function goToHomeWithFade() {
    pauseBtn.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    screenOverlay.style.opacity = '1';

    setTimeout(() => {
        gameoverScreen.classList.add('hidden');
        levelEndScreen.classList.add('hidden');
        destructionScreen.classList.add('hidden');
        destructionScreen.style.background = 'transparent';

        startScreen.classList.remove('hidden');
        updateLevelSelectUI();
        startTitle.classList.remove('fade-out');
        startBtn.classList.remove('fade-out');
        const levelSelectBtn = document.getElementById('level-select-btn');
        if (levelSelectBtn) levelSelectBtn.classList.remove('fade-out');
        gameState = 'START';
        screenOverlay.style.opacity = '0';
    }, 2000);
}

function updateTestModeOptions(changedId = null) {
    const phase2 = document.getElementById('test-phase-2');
    const phase3 = document.getElementById('test-phase-3');
    const resetProgress = document.getElementById('test-reset-progress');
    const phaseOptions = [phase2, phase3].filter(Boolean);

    // Reset e desbloqueio são mutuamente exclusivos, mas ambos podem ser
    // desmarcados normalmente pelo jogador.
    if (resetProgress && changedId === 'test-reset-progress' && resetProgress.checked) {
        phaseOptions.forEach((input) => { input.checked = false; });
    }

    const anyPhaseSelected = phaseOptions.some((input) => input.checked);

    if (resetProgress && changedId && changedId !== 'test-reset-progress' && anyPhaseSelected) {
        resetProgress.checked = false;
    }

    const resetSelected = !!resetProgress?.checked;

    phaseOptions.forEach((input) => {
        input.disabled = resetSelected;
        const label = input.closest('.test-option');
        if (label) label.classList.toggle('disabled', resetSelected);
    });

    if (resetProgress) {
        resetProgress.disabled = anyPhaseSelected;
        const resetLabel = resetProgress.closest('.test-option');
        if (resetLabel) resetLabel.classList.toggle('disabled', anyPhaseSelected);
    }
}

function unlockAllProgressForTesting() {
    if (!testUnlockScreen) return;

    const phase2 = document.getElementById('test-phase-2');
    const phase3 = document.getElementById('test-phase-3');
    const resetProgress = document.getElementById('test-reset-progress');
    if (phase2) phase2.checked = false;
    if (phase3) phase3.checked = false;
    if (resetProgress) resetProgress.checked = false;
    updateTestModeOptions();

    testUnlockScreen.classList.remove('hidden');
}

function applyTestUnlockSelection() {
    const phase2 = document.getElementById('test-phase-2');
    const phase3 = document.getElementById('test-phase-3');
    const resetProgress = document.getElementById('test-reset-progress');

    if (resetProgress?.checked) {
        resetGameProgress();
        return;
    }

    const selected = [];

    if (phase2?.checked) {
        level2Unlocked = true;
        localStorage.setItem(LEVEL2_UNLOCK_KEY, 'true');
        selected.push('Fase 2');
    }

    if (phase3?.checked) {
        level3Unlocked = true;
        localStorage.setItem(LEVEL3_UNLOCK_KEY, 'true');
        selected.push('Fase 3');
    }

    updateLevelSelectUI();
    closeTestUnlockMenu();

    if (selected.length) {
        const unlockedText = selected.length === 1
            ? `${selected[0]} desbloqueada com sucesso!`
            : `Fases ${selected.map((item) => item.replace('Fase ', '')).join(' e ')} desbloqueadas com sucesso!`;
        showTestFeedback('DESBLOQUEIO CONCLUÍDO', unlockedText);
    } else {
        showTestFeedback('MODO DE TESTE', 'Nenhuma opção foi selecionada.');
    }
}

function closeTestUnlockMenu() {
    if (testUnlockScreen) testUnlockScreen.classList.add('hidden');
}

function resetGameProgress() {
    const confirmScreen = document.getElementById('test-reset-confirm-screen');
    if (!confirmScreen) return;
    confirmScreen.classList.remove('hidden');
}

function cancelResetGameProgress() {
    const confirmScreen = document.getElementById('test-reset-confirm-screen');
    if (confirmScreen) confirmScreen.classList.add('hidden');
}

function showTestFeedback(title, message) {
    const screen = document.getElementById('test-feedback-screen');
    const titleEl = document.getElementById('test-feedback-title');
    const textEl = document.getElementById('test-feedback-text');
    if (!screen) return;
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = message;
    screen.classList.remove('hidden');
}

function closeTestFeedback() {
    const screen = document.getElementById('test-feedback-screen');
    if (screen) screen.classList.add('hidden');
}

function confirmResetGameProgress() {
    const confirmScreen = document.getElementById('test-reset-confirm-screen');
    if (confirmScreen) confirmScreen.classList.add('hidden');

    const resetProgress = document.getElementById('test-reset-progress');
    if (resetProgress) resetProgress.checked = false;

    closeTestUnlockMenu();

    // Remove o desbloqueio atual e também a chave antiga usada nas versões anteriores.
    localStorage.removeItem(LEVEL2_UNLOCK_KEY);
    localStorage.removeItem('chronosDefenderLevel2Unlocked');
    localStorage.removeItem(LEVEL3_UNLOCK_KEY);
    localStorage.removeItem(PLASMA_WEAPON_KEY);
    localStorage.removeItem('chronosDefenderPlasmaWeaponMessageSeen_v1');
    localStorage.removeItem(LEVEL3_COMPLETED_KEY);
    level3Completed = false;
    plasmaWeaponUnlocked = false;

    level2Unlocked = false;
    level3Unlocked = false;
    currentLevel = 1;

    if (stageInterval) {
        clearInterval(stageInterval);
        stageInterval = null;
    }

    if (scoreAnimationInterval) {
        clearInterval(scoreAnimationInterval);
        scoreAnimationInterval = null;
    }

    resetStageValues();

    // Fecha todas as telas de partida/resultado.
    objectiveScreen.classList.remove('visible');
    objectiveScreen.classList.remove('weapon-tutorial-texture');
    gameoverScreen.classList.add('hidden');
    levelEndScreen.classList.add('hidden');
    destructionScreen.classList.add('hidden');
    destructionContent.classList.add('hidden');
    pauseScreen.classList.add('hidden');

    // Limpa qualquer fade que tenha ficado ativo.
    screenOverlay.style.opacity = '0';

    startTitle.classList.remove('fade-out');
    startBtn.classList.remove('fade-out');

    const levelSelectBtn = document.getElementById('level-select-btn');
    if (levelSelectBtn) {
        levelSelectBtn.classList.remove('fade-out');
    }

    isEngineIgnited = false;
    isLiftoffStarted = false;
    shakeIntensity = 0;
    landShipY = 480;
    landShipSpeed = 0;
    landShipAccel = 0;
    fadeTriggered = false;

    updateLevelSelectUI();

    startScreen.classList.remove('hidden');
    gameState = 'START';
    showTestFeedback('PROGRESSO REINICIADO', 'Progresso reiniciado com sucesso! As Fases 2 e 3 estão bloqueadas novamente.');
}

function triggerGameOver() {
    gameState = 'GAMEOVER';
    pauseBtn.classList.add('hidden');
    clearInterval(stageInterval);

    createImpactEffect(
        particles,
        ship.x + ship.width / 2,
        ship.y + ship.height / 2,
        false,
        120
    );

    setTimeout(() => {
        gameoverMsg.classList.remove('visible');
        gameoverBtns.classList.remove('visible');

        gameoverScreen.classList.remove('hidden');
        animateScoreDisplay(score, gameoverScoreElem, gameoverMsg, gameoverBtns, false);
    }, 2200);
}

function showPlanetWeaponWarning() {
    planetWeaponWarningUntil = performance.now() + 2000;
    const warning = document.getElementById('planet-weapon-warning');
    if (warning) {
        warning.classList.remove('visible');
        void warning.offsetWidth;
        warning.classList.add('visible');
    }
}

function triggerPlanetTouchEnd() {
    if (isShipExiting) return;

    // Na Fase 2, a nave só pode partir depois que a Arma de Plasma foi recolhida.
    if (currentLevel === 2 && !plasmaWeaponPickedUp) {
        showPlanetWeaponWarning();
        return;
    }

    isShipExiting = true;
    pauseBtn.classList.add('hidden');
}

function showLevelResultsScreen() {
    gameState = 'LEVEL_FINISHED';
    pauseBtn.classList.add('hidden');

    const passed = score >= getCurrentMinScore();

    // A Fase 2 fica desbloqueada imediatamente ao concluir a Fase 1,
    // mesmo antes de apertar PROSSEGUIR.
    if (currentLevel === 1 && passed) {
        level2Unlocked = true;
        localStorage.setItem(LEVEL2_UNLOCK_KEY, 'true');
        updateLevelSelectUI();
    }

    // A Fase 3 será liberada ao concluir a Fase 2.
    // A Arma de Plasma só passa a ser um desbloqueio permanente se a Fase 2
    // for concluída com a arma em mãos. Se o jogador morrer antes disso, a
    // coleta não fica salva.
    if (currentLevel === 2 && passed) {
        if (plasmaWeaponPickedUp) {
            localStorage.setItem(PLASMA_WEAPON_KEY, 'true');
            plasmaWeaponUnlocked = true;
        }
        level3Unlocked = true;
        localStorage.setItem(LEVEL3_UNLOCK_KEY, 'true');
        updateLevelSelectUI();
    }

    if (passed) {
        statusHeaderTitle.innerText = 'SUCESSO TÁTICO';
        statusHeaderTitle.style.color = '#00ffcc';
        statusHeaderTitle.style.textShadow = '0 0 15px rgba(0, 255, 204, 0.8)';
        statusBodyText.innerText = 'Quantidade de diamantes suficientes para a missão';
        levelNextBtn.innerText = 'PROSSEGUIR';
        levelHomeBtn.classList.remove('hidden');
    } else {
        statusHeaderTitle.innerText = 'DIAMANTES INSUFICIENTES';
        statusHeaderTitle.style.color = '#ff4444';
        statusHeaderTitle.style.textShadow = '0 0 15px rgba(255, 68, 68, 0.8)';
        statusBodyText.innerText = 'A nave não coletou a quantidade necessária para estabilizar o salto';
        levelNextBtn.innerText = 'OBSERVAR';
        levelHomeBtn.classList.add('hidden');
    }

    levelStatusMsg.classList.remove('visible');
    levelBtns.classList.remove('visible');

    levelEndScreen.classList.remove('hidden');
    screenOverlay.style.opacity = '0';

    animateScoreDisplay(
        score,
        animatedScoreElem,
        levelStatusMsg,
        levelBtns,
        true
    );
}

function handleLevelEndAction() {
    const passed = score >= getCurrentMinScore();

    // Fase 1: PROSSEGUIR leva diretamente para a Fase 2.
    if (currentLevel === 1 && passed) {
        goToNextLevel();
        return;
    }

    // Fase 2: PROSSEGUIR leva diretamente para a Fase 3.
    if (currentLevel === 2 && passed) {
        goToNextLevel();
        return;
    }

    if (currentLevel === 3 && passed) {
        level3Completed = true;
        localStorage.setItem(LEVEL3_COMPLETED_KEY, 'true');
        alert('PARABÉNS! Você conseguiu coletar todos os diamantes necessários!');
        return;
    }

    if (passed) {
        alert('PARABÉNS! Você conseguiu coletar todos os diamantes necessários!');
    } else {
        screenOverlay.style.opacity = '1';

        setTimeout(() => {
            levelEndScreen.classList.add('hidden');
            startObservingCutscene();
        }, 2000);
    }
}

function startObservingCutscene() {
    gameState = 'OBSERVING_CUTSCENE';
    pauseBtn.classList.add('hidden');
    destructionScreen.style.background = 'transparent';
    destructionScreen.classList.remove('hidden');
    screenOverlay.style.opacity = '0';

    destructionShipY = 650;
    destructionShipSpeed = 2.4;
    isDestructionShipExploded = false;

    setTimeout(() => {
        isDestructionShipExploded = true;

        createImpactEffect(
            particles,
            400,
            destructionShipY,
            false,
            90
        );

        setTimeout(() => {
            destructionScreen.style.background = 'rgba(10, 10, 15, 0.85)';
            destructionContent.classList.remove('hidden');
        }, 1500);

    }, 3500);
}

function animateScoreDisplay(targetScore, displayElem, textElem, btnsElem, showMax = true) {
    let currentDisplay = 0;

    displayElem.innerText = showMax
        ? `0/${getCurrentMinScore()}`
        : '0';

    function revealUISequentially() {
        textElem.classList.add('visible');

        setTimeout(() => {
            btnsElem.classList.add('visible');
        }, 800);
    }

    if (targetScore === 0) {
        revealUISequentially();
        return;
    }

    let intervalTime = 60;
    const startTime = Date.now();
    let speedUpApplied = false;

    function startCounting() {
        if (scoreAnimationInterval) clearInterval(scoreAnimationInterval);

        scoreAnimationInterval = setInterval(() => {
            currentDisplay += 10;

            if (currentDisplay >= targetScore) {
                currentDisplay = targetScore;
                clearInterval(scoreAnimationInterval);
                revealUISequentially();
            }

            displayElem.innerText = showMax
                ? `${currentDisplay}/${getCurrentMinScore()}`
                : `${currentDisplay}`;

            if (!speedUpApplied && (Date.now() - startTime >= 3500)) {
                speedUpApplied = true;
                intervalTime = 15;
                startCounting();
            }
        }, intervalTime);
    }

    startCounting();
}

function createPlasmaShot() {
    if (currentLevel < 3 || !plasmaWeaponPickedUp || gameState !== 'PLAYING') return false;
    if (plasmaAmmo <= 0) return false;

    plasmaAmmo--;
    plasmaShots.push({
        x: ship.x + ship.width / 2,
        y: ship.y - 8,
        speed: 11,
        radius: 4,
        life: 0,
        maxLife: 900,
        pulse: 0
    });
    createImpactEffect(particles, ship.x + ship.width / 2, ship.y - 5, true, 5);
    return true;
}

function updatePlasmaShots() {
    if (currentLevel < 3 || !plasmaWeaponPickedUp) return;

    const holdingSpace = keys[' '] || keys['Spacebar'];
    if (holdingSpace && plasmaAmmo > 0) {
        plasmaShotCooldown -= 1000 / 60;
        while (plasmaShotCooldown <= 0 && plasmaAmmo > 0) {
            createPlasmaShot();
            plasmaShotCooldown += PLASMA_SHOT_INTERVAL;
        }
    } else {
        plasmaShotCooldown = 0;
    }

    for (let i = plasmaShots.length - 1; i >= 0; i--) {
        const shot = plasmaShots[i];
        shot.y -= shot.speed;
        shot.life += 1000 / 60;
        shot.pulse += 0.35;

        let removed = false;

        for (let j = asteroids.length - 1; j >= 0; j--) {
            const ast = asteroids[j];
            const dx = shot.x - ast.x;
            const dy = shot.y - ast.y;
            const hitDistance = shot.radius + ast.radius;

            if (dx * dx + dy * dy <= hitDistance * hitDistance) {
                if (ast.type === 3) {
                    ast.hp = (ast.hp ?? 5) - 1;
                    createImpactEffect(particles, shot.x, shot.y, true, 8);

                    if (ast.hp <= 0) {
                        const x = ast.x;
                        const y = ast.y;
                        const parentSpeed = ast.speed;
                        const parentRotation = ast.rotation;
                        asteroids.splice(j, 1);

                        createImpactEffect(particles, x, y, false, 28);

                        const fragments = [
                            { radius: 13, speed: parentSpeed * 1.05 },
                            { radius: 21, speed: parentSpeed * 1.02 }
                        ];

                        for (let k = 0; k < fragments.length; k++) {
                            const f = fragments[k];
                            asteroids.push({
                                x: x + (k === 0 ? -10 : 10),
                                y,
                                radius: f.radius,
                                speed: f.speed,
                                rotation: parentRotation + k * 0.5,
                                rotationSpeed: (Math.random() - 0.5) * 0.03,
                                flameFrame: Math.random() * 10,
                                vertices: generateAsteroidVerticesLocal(f.radius),
                                type: k === 0 ? 1 : 2,
                                hp: k === 1 ? 3 : 1
                            });
                        }
                    }
                } else {
                    ast.hp = (ast.hp ?? (ast.type === 2 ? 3 : 1)) - 1;
                    createImpactEffect(particles, shot.x, shot.y, true, 8);

                    if (ast.hp <= 0) {
                        const x = ast.x;
                        const y = ast.y;
                        asteroids.splice(j, 1);
                        // Meteoro destruído pela arma usa a mesma explosão visual das demais destruições.
                        createImpactEffect(particles, x, y, false, 28);
                    }
                }

                plasmaShots.splice(i, 1);
                removed = true;
                break;
            }
        }

        if (!removed && (shot.y < -30 || shot.life > shot.maxLife)) {
            plasmaShots.splice(i, 1);
        }
    }
}

function generateAsteroidVerticesLocal(baseRadius, numPoints = 8) {
    const vertices = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const r = baseRadius * (0.85 + Math.random() * 0.3);
        vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return vertices;
}

function triggerPlasmaWeaponEvent() {
    if (currentLevel !== 2 || plasmaWeaponEventTriggered) return;

    plasmaWeaponEventTriggered = true;
    plasmaWeaponDropReady = false;
    plasmaWeaponDropComplete = false;

    // O UFO entra pela esquerda e para exatamente no centro.
    alienUfo = {
        x: -100,
        y: 185,
        phase: 'ENTERING',
        speed: 4.2,
        targetX: canvas.width / 2,
        timer: 0
    };

    plasmaWeapon = null;
}

function updatePlasmaWeaponEvent() {
    if (currentLevel !== 2) return;

    if (alienUfo) {
        alienUfo.timer++;

        if (alienUfo.phase === 'ENTERING') {
            alienUfo.x += alienUfo.speed;
            alienUfo.y = 185 + Math.sin(alienUfo.timer * 0.08) * 7;

            if (alienUfo.x >= alienUfo.targetX) {
                alienUfo.x = alienUfo.targetX;
                alienUfo.phase = 'DROPPING';
                alienUfo.timer = 0;
            }
        } else if (alienUfo.phase === 'DROPPING') {
            // O Alien fica parado no centro enquanto deixa a arma.
            alienUfo.y = 185;

            if (alienUfo.timer >= 45 && !plasmaWeaponDropReady) {
                plasmaWeapon = {
                    x: alienUfo.x,
                    y: alienUfo.y + 42,
                    radius: 18,
                    active: true,
                    bob: 0,
                    dropY: alienUfo.y + 92,
                    dropping: true
                };
                plasmaWeaponDropReady = true;
            }

            if (plasmaWeaponDropReady && plasmaWeapon?.dropping) {
                plasmaWeapon.y += 2.8;

                if (plasmaWeapon.y >= plasmaWeapon.dropY) {
                    plasmaWeapon.y = plasmaWeapon.dropY;
                    plasmaWeapon.dropping = false;
                    plasmaWeaponDropComplete = true;
                    alienUfo.phase = 'RETURNING_LEFT';
                    alienUfo.timer = 0;
                }
            }
        } else if (alienUfo.phase === 'RETURNING_LEFT') {
            // Volta pelo lado esquerdo após entregar a arma.
            alienUfo.x -= 5.5;
            alienUfo.y -= 0.15;

            if (alienUfo.x < -120) {
                // Agora ele reaparece bem pequeno e muito rápido no fundo,
                // atravessando a cena da esquerda para a direita.
                alienUfo.x = -90;
                alienUfo.y = 115;
                alienUfo.phase = 'SCENERY';
                alienUfo.timer = 0;
            }
        } else if (alienUfo.phase === 'SCENERY') {
            alienUfo.x += 5.2;
            alienUfo.y += Math.sin(alienUfo.timer * 0.03) * 0.03;

            if (alienUfo.x > canvas.width + 80) {
                alienUfo = null;
            }
        }
    }

    if (plasmaWeapon?.active && !plasmaWeapon.dropping) {
        plasmaWeapon.bob += 0.08;

        const shipCenterX = ship.x + ship.width / 2;
        const shipCenterY = ship.y + ship.height / 2;
        const dx = shipCenterX - plasmaWeapon.x;
        const dy = shipCenterY - plasmaWeapon.y;
        const pickupDistance = 28 + plasmaWeapon.radius;

        if (dx * dx + dy * dy <= pickupDistance * pickupDistance) {
            plasmaWeapon.active = false;
            plasmaWeaponPickedUp = true;
            // A coleta durante a fase é apenas temporária.
            // O desbloqueio permanente só acontece ao concluir a Fase 2 com a arma.
            plasmaAmmo = PLASMA_MAX_AMMO;

            createImpactEffect(particles, plasmaWeapon.x, plasmaWeapon.y, true, 35);
            showWeaponPickupObjective();
        }
    }
}

function spawnPlasmaCharger() {
    if (currentLevel !== 3 || !plasmaWeaponPickedUp || plasmaAmmo > 5 || plasmaCharger) return;

    plasmaCharger = {
        x: Math.random() * (canvas.width - 180) + 40,
        y: -30,
        size: 18,
        speed: 1.8,
        pulse: 0
    };
}

function updatePlasmaCharger() {
    if (currentLevel !== 3 || !plasmaWeaponPickedUp) return;

    // Quando o planeta começa a descer, nenhum carregador novo deve surgir.
    // Se ainda houver um na tela, ele também é removido junto com os demais spawns.
    if (isTargetPlanetDescending) {
        plasmaCharger = null;
        plasmaChargerSpawnTimer = 0;
        return;
    }

    // A chance só começa a ser contada quando restam 5 disparos ou menos.
    // Antes disso, o contador fica zerado para não acumular chances em segredo.
    if (plasmaAmmo <= 5 && !plasmaCharger) {
        plasmaChargerSpawnTimer++;
        if (plasmaChargerSpawnTimer >= 90) {
            plasmaChargerSpawnTimer = 0;
            if (Math.random() < PLASMA_RECHARGE_CHANCE) {
                spawnPlasmaCharger();
            }
        }
    } else {
        plasmaChargerSpawnTimer = 0;
    }

    if (!plasmaCharger) return;

    plasmaCharger.y += plasmaCharger.speed;
    plasmaCharger.pulse += 0.15;

    const shipCenterX = ship.x + ship.width / 2;
    const shipCenterY = ship.y + ship.height / 2;
    const dx = shipCenterX - plasmaCharger.x;
    const dy = shipCenterY - plasmaCharger.y;

    if (dx * dx + dy * dy <= (28 + plasmaCharger.size) ** 2) {
        plasmaAmmo = PLASMA_MAX_AMMO;
        plasmaCharger = null;
        plasmaChargerSpawnTimer = 0;
        createImpactEffect(particles, shipCenterX, shipCenterY, true, 24);
        return;
    }

    if (plasmaCharger.y > canvas.height + 40) {
        // Saiu da tela: deixa de bloquear uma nova tentativa de spawn.
        plasmaCharger = null;
        plasmaChargerSpawnTimer = 0;
    }
}

function drawPlasmaCharger(ctx) {
    if (!plasmaCharger) return;
    ctx.save();
    const pulse = Math.sin(plasmaCharger.pulse) * 2;
    ctx.translate(plasmaCharger.x, plasmaCharger.y);
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#b46cff';
    ctx.fillStyle = '#24143f';
    ctx.strokeStyle = '#b46cff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16 - pulse / 2, -20 - pulse / 2, 32 + pulse, 40 + pulse, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c78cff';
    ctx.fillRect(-5, -11, 10, 22);
    ctx.fillRect(-11, -5, 22, 10);
    ctx.fillStyle = '#f0ddff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#b46cff';
    ctx.fillText('PLASMA', 0, 30);
    ctx.restore();
}


function checkCollisions() {
    if (gameState !== 'PLAYING' || isShipExiting) return;

    const shipCenterX = ship.x + ship.width / 2;
    const shipCenterY = ship.y + ship.height / 2;
    const shipRadius = Math.max(ship.width, ship.height) / 2 * 0.75;

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];

        const distX = shipCenterX - ast.x;
        const distY = shipCenterY - ast.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < shipRadius + ast.radius) {
            ship.lives -= ast.type === 3 ? 2 : 1;

            createImpactEffect(
                particles,
                shipCenterX,
                shipCenterY,
                false
            );

            asteroids.splice(i, 1);

            if (ship.lives <= 0) {
                triggerGameOver();
                return;
            }
        }
    }

    for (let i = diamonds.length - 1; i >= 0; i--) {
        const d = diamonds[i];

        const distX = shipCenterX - d.x;
        const distY = shipCenterY - d.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < shipRadius + d.size) {
            score += 10;
            createImpactEffect(particles, d.x, d.y, true);
            diamonds.splice(i, 1);
        }
    }

    if (isTargetPlanetDescending) {
        const config = getCurrentLevelConfig();
        const distPlanetX = shipCenterX - config.targetPlanetX;
        const distPlanetY = shipCenterY - targetPlanetY;
        const distToPlanet = Math.sqrt(
            distPlanetX * distPlanetX +
            distPlanetY * distPlanetY
        );

        if (distToPlanet <= config.targetPlanetRadius) {
            if (currentLevel === 2 && !plasmaWeaponPickedUp) {
                // Sem a Arma de Plasma, o planeta verde é apenas parte do fundo:
                // possui hitbox, mas nunca permite a conclusão da fase.
                const safeDistance = config.targetPlanetRadius + shipRadius + 6;
                if (distToPlanet > 0) {
                    const nx = distPlanetX / distToPlanet;
                    const ny = distPlanetY / distToPlanet;
                    const correctedCenterX = config.targetPlanetX + nx * safeDistance;
                    const correctedCenterY = targetPlanetY + ny * safeDistance;
                    ship.x = correctedCenterX - ship.width / 2;
                    ship.y = correctedCenterY - ship.height / 2;
                }
                if (performance.now() >= planetWeaponWarningUntil) showPlanetWeaponWarning();
            } else {
                triggerPlanetTouchEnd();
            }
        }
    }
}

function update() {
    if (gameState === 'PAUSED') return;

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.y += star.speed;

        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    }

    meteor.timer++;

    if (!meteor.active && meteor.timer > 180) {
        if (Math.random() < 0.3) {
            spawnMeteor(meteor, canvas);
        }
        meteor.timer = 0;
    }

    if (meteor.active) {
        meteor.x += meteor.dx;
        meteor.y += meteor.dy;

        if (
            meteor.x > canvas.width + 100 ||
            meteor.y > canvas.height + 100
        ) {
            meteor.active = false;
        }
    }

    if (gameState === 'INTRO') {
        if (isLiftoffStarted) {
            landShipSpeed += landShipAccel;
            landShipY -= landShipSpeed;

            if (shakeIntensity > 0) {
                shakeIntensity -= 0.04;

                if (shakeIntensity < 0) {
                    shakeIntensity = 0;
                }
            }

            if (landShipY < -100 && !fadeTriggered) {
                fadeTriggered = true;

                setTimeout(() => {
                    triggerGameTransition();
                }, 1500);
            }
        }

        return;
    }

    if (gameState === 'OBJECTIVE_PAUSE') {
        return;
    }

    if (gameState === 'OBSERVING_CUTSCENE') {
        if (!isDestructionShipExploded) {
            destructionShipY -= destructionShipSpeed;
        }

        updateParticles(particles);
        return;
    }

    if (gameState !== 'PLAYING') {
        updateParticles(particles);
        return;
    }

    updatePlasmaWeaponEvent();

    if (isShipExiting) {
        ship.y -= shipExitSpeed;
        ship.flameFrame += 0.5;

        if (ship.y < -ship.height && !fadeTriggered) {
            fadeTriggered = true;
            screenOverlay.style.opacity = '1';

            setTimeout(() => {
                showLevelResultsScreen();
            }, 2000);
        }

        return;
    }

    updatePlasmaShots();
    updatePlasmaCharger();

    ship.dx = 0;
    ship.dy = 0;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        ship.dx = -ship.speed;
    }

    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        ship.dx = ship.speed;
    }

    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        ship.dy = -ship.speed;
    }

    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        ship.dy = ship.speed;
    }

    ship.x += ship.dx;
    ship.y += ship.dy;

    if (ship.x < 0) ship.x = 0;

    if (ship.x + ship.width > canvas.width - 90) {
        ship.x = canvas.width - 90 - ship.width;
    }

    if (ship.y < 0) ship.y = 0;

    if (ship.y + ship.height > canvas.height) {
        ship.y = canvas.height - ship.height;
    }

    if (stageTimer > 4) {
        spawnTimer++;

        if (spawnTimer > 45) {
            spawnAsteroid(asteroids, canvas, getCurrentLevelConfig().asteroidChances);
            spawnTimer = 0;
        }

        diamondSpawnTimer++;

        if (diamondSpawnTimer > 90) {
            spawnDiamond(diamonds, canvas);
            diamondSpawnTimer = 0;
        }
    } else {
        isTargetPlanetDescending = true;

        if (targetPlanetY < getCurrentLevelConfig().targetPlanetFinalY) {
            targetPlanetY += 2;
        }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const ast = asteroids[i];

        ast.y += ast.speed * (currentLevel === 3 ? 1.015 : 1);
        ast.rotation += ast.rotationSpeed;
        ast.flameFrame += 0.2;

        if (ast.y - ast.radius > canvas.height) {
            asteroids.splice(i, 1);
        }
    }

    for (let i = diamonds.length - 1; i >= 0; i--) {
        const d = diamonds[i];

        d.y += d.speed;
        d.pulse += 0.08;

        if (d.y - d.size > canvas.height) {
            diamonds.splice(i, 1);
        }
    }

    updateParticles(particles);

    ship.flameFrame += 0.3;

    checkCollisions();
}

let spawnTimer = 0;
let diamondSpawnTimer = 0;

function drawProgressHUD() {
    const config = getCurrentLevelConfig();
    const x = canvas.width - 45;
    const topY = 120;
    const bottomY = 510;
    const trackHeight = bottomY - topY;

    ctx.save();

    // Representação do planeta de destino no topo do timer.
    ctx.fillStyle = config.timerPlanetFill || '#5c2d69';
    ctx.strokeStyle = config.timerPlanetStroke || '#00ffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, topY - 22, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Metade do planeta na base do temporizador = planeta de origem da fase.
    ctx.fillStyle = config.startPlanetFill || '#11112b';
    ctx.strokeStyle = config.startPlanetStroke || '#00ffff';

    ctx.beginPath();
    ctx.arc(x, bottomY + 18, 25, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#00ffff66';
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.stroke();

    const progress = Math.min(1, Math.max(0, (config.duration - stageTimer) / config.duration));
    const iconY = bottomY - (progress * trackHeight);

    ctx.save();
    ctx.translate(x, iconY);

    ctx.fillStyle = config.timerPlanetStroke || '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-6, 6);
    ctx.lineTo(-2, 3);
    ctx.lineTo(0, 5);
    ctx.lineTo(2, 3);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.restore();
}

function drawPlasmaWeaponIcon(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Ícone vetorial da Arma de Plasma, sem emoji/imagem externa.
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#d8e8f2';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-28, -7);
    ctx.lineTo(10, -7);
    ctx.lineTo(25, 0);
    ctx.lineTo(10, 7);
    ctx.lineTo(-28, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#27384a';
    ctx.beginPath();
    ctx.roundRect(-18, 7, 14, 19, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(8, 0, 5 + Math.sin(performance.now() * 0.008) * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(-24, -3, 13, 6);
    ctx.restore();
}

function drawPlasmaShot(ctx, shot) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - shot.life / shot.maxLife);
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#bfffff';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.ellipse(shot.x, shot.y, shot.radius * 0.65, shot.radius * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawAlienUfo(ctx, ufo) {
    if (!ufo) return;
    ctx.save();
    ctx.translate(ufo.x, ufo.y);
    const sceneryScale = ufo.phase === 'SCENERY' ? 0.30 : 1;
    ctx.scale(sceneryScale, sceneryScale);
    ctx.globalAlpha = ufo.phase === 'SCENERY' ? 0.38 : 1;
    ctx.shadowBlur = ufo.phase === 'SCENERY' ? 4 : 14;
    ctx.shadowColor = '#9d7cff';

    ctx.fillStyle = '#596273';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 9, 38, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#9d7cff';
    ctx.beginPath();
    ctx.ellipse(0, 1, 20, 13, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b9fff2';
    ctx.beginPath();
    ctx.ellipse(0, 2, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#ffb84d';
        ctx.beginPath();
        ctx.arc(i * 13, 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Pequeno alien visível na cabine.
    ctx.fillStyle = '#77ff99';
    ctx.beginPath();
    ctx.arc(0, -1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#102010';
    ctx.beginPath();
    ctx.arc(-2, -2, 1, 0, Math.PI * 2);
    ctx.arc(2, -2, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawPlasmaWeapon(ctx) {
    if (!plasmaWeapon?.active) return;
    drawPlasmaWeaponIcon(ctx, plasmaWeapon.x, plasmaWeapon.y + Math.sin(plasmaWeapon.bob) * 4, 0.72);

    ctx.save();
    ctx.strokeStyle = '#00ffff88';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(plasmaWeapon.x, plasmaWeapon.y, 29, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawPlasmaWeaponHud() {
    const x = 55;
    const y = canvas.height - 43;

    ctx.save();
    ctx.fillStyle = 'rgba(3, 12, 24, 0.88)';
    ctx.strokeStyle = '#00ffff99';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(12, canvas.height - 78, 280, 60, 8);
    ctx.fill();
    ctx.stroke();

    drawPlasmaWeaponIcon(ctx, x + 2, y + 2, 0.58);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';
    ctx.fillText('ARMA DE PLASMA', 91, y - 4);
    ctx.fillStyle = '#00ffcc';
    ctx.font = '12px monospace';
    ctx.fillText('SEGURE ESPAÇO PARA ATIRAR', 91, y + 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`PLASMA: ${plasmaAmmo}/${PLASMA_MAX_AMMO}`, 91, y + 32);
    ctx.restore();
}

function drawUI() {
    const warning = document.getElementById('planet-weapon-warning');
    if (warning && planetWeaponWarningUntil && performance.now() > planetWeaponWarningUntil) {
        warning.classList.remove('visible');
        planetWeaponWarningUntil = 0;
    }
    ctx.font = '13px monospace';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('NÚCLEO DE ENERGIA (VIDAS):', 20, 25);

    for (let i = 0; i < ship.maxLives; i++) {
        const active = i < ship.lives;

        ctx.save();
        ctx.translate(20 + (i * 35), 45);

        ctx.fillStyle = active ? '#112233' : '#1a1a1a';
        ctx.strokeStyle = active ? '#00ffff' : '#444444';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.rect(0, 0, 20, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = active ? '#00ffff' : '#444444';

        ctx.beginPath();
        ctx.arc(10, 8, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    ctx.save();
    ctx.font = '14px monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText(`PONTOS: ${score}`, canvas.width - 200, 25);
    ctx.restore();

    drawProgressHUD();

    if (currentLevel === 3 && plasmaWeaponPickedUp) {
        drawPlasmaWeaponHud();
    }
}

function draw() {
    ctx.save();

    if (shakeIntensity > 0) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(offsetX, offsetY);
    }

    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    drawMeteor(ctx, meteor);

    if (currentLevel === 2) {
        drawAlienUfo(ctx, alienUfo);
    }

    if (gameState === 'START' || gameState === 'INTRO') {
        const startPlanetDrawer = startPlanetDrawers[currentLevel] || drawPlanetLevel1;
        startPlanetDrawer(ctx);
        drawLandedShip(ctx, landShipX, landShipY, isEngineIgnited);

    } else if (
        gameState === 'OBJECTIVE_PAUSE' ||
        gameState === 'PLAYING' ||
        gameState === 'PAUSED' ||
        gameState === 'LEVEL_FINISHED'
    ) {
        const targetDrawer = targetPlanetDrawers[currentLevel] || drawTargetPlanetLevel1;
        targetDrawer(
            ctx,
            { gameState, isTargetPlanetDescending, plasmaWeaponPickedUp },
            targetPlanetY
        );

        drawPlasmaWeapon(ctx);
        drawPlasmaCharger(ctx);

        for (let i = 0; i < plasmaShots.length; i++) {
            drawPlasmaShot(ctx, plasmaShots[i]);
        }

        for (let i = 0; i < diamonds.length; i++) {
            drawDiamond(ctx, diamonds[i]);
        }

        for (let i = 0; i < asteroids.length; i++) {
            drawAsteroid(ctx, asteroids[i]);
        }

        drawParticles(ctx, particles);

        if (
            gameState === 'PLAYING' ||
            gameState === 'PAUSED' ||
            gameState === 'OBJECTIVE_PAUSE'
        ) {
            drawShip(ctx, ship, keys, isShipExiting, gameState);
        }

        drawUI();

    } else if (gameState === 'OBSERVING_CUTSCENE') {
        const targetDrawer = targetPlanetDrawers[currentLevel] || drawTargetPlanetLevel1;
        targetDrawer(
            ctx,
            { gameState, isTargetPlanetDescending, plasmaWeaponPickedUp },
            targetPlanetY
        );

        if (!isDestructionShipExploded) {
            drawLandedShip(ctx, 400, destructionShipY, true);
        }

        drawParticles(ctx, particles);

    } else if (gameState === 'GAMEOVER') {
        drawParticles(ctx, particles);
    }

    ctx.restore();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();

// Funções usadas diretamente pelos onclicks do HTML.
// Em módulos ES, elas não ficam automaticamente no window.
window.togglePause = togglePause;
window.resumeGame = resumeGame;
window.restartGameFromPause = restartGameFromPause;
window.goToHomeFromPause = goToHomeFromPause;
window.startIntroSequence = startIntroSequence;
window.restartGameWithFade = restartGameWithFade;
window.goToHomeWithFade = goToHomeWithFade;
window.handleLevelEndAction = handleLevelEndAction;
window.openLevelSelector = openLevelSelector;
window.closeLevelSelector = closeLevelSelector;
window.selectLevel = selectLevel;
window.applyTestUnlockSelection = applyTestUnlockSelection;
window.closeTestUnlockMenu = closeTestUnlockMenu;
window.updateTestModeOptions = updateTestModeOptions;
window.resetGameProgress = resetGameProgress;
window.confirmResetGameProgress = confirmResetGameProgress;
window.cancelResetGameProgress = cancelResetGameProgress;
window.showTestFeedback = showTestFeedback;
window.closeTestFeedback = closeTestFeedback;
