let totalFlips = 0;
let headsCount = 0;
let tailsCount = 0;
let currentStreak = 0;
let lastResult = null;
let isPirateMode = false;

const coinImage = document.getElementById('coin-image');
const flipButton = document.getElementById('flip-button');
const resultDisplay = document.getElementById('result');
const themeButton = document.getElementById('theme-button');
const flipSound = document.getElementById('flip-sound');

// Sound settings & persistence
let audioContext = null;
let isMuted = false;
let volume = Number(localStorage.getItem('coinVolume') || 1);
let muteStored = localStorage.getItem('coinMuted') === 'true';
if (muteStored) isMuted = true;

// Image paths (put your images in assets/images/)
const headsImg = 'assets/images/heads.png';
const headsImg2x = 'assets/images/heads@2x.png';
const tailsImg = 'assets/images/tails.png';
const pirateHeadsImg = 'assets/images/pirate-heads.svg';
const pirateTailsImg = 'assets/images/pirate-tails.svg';

// Preload images to avoid flicker
[headsImg, headsImg2x, tailsImg, pirateHeadsImg, pirateTailsImg].forEach(src => {
    const img = new Image();
    img.src = src;
});

const coinWrap = document.getElementById('coin-wrap');
const coinShadow = document.getElementById('coin-shadow');
const sr = document.createElement('div'); sr.id = 'sr'; sr.className = 'sr-only'; sr.setAttribute('aria-live','polite'); document.body.appendChild(sr);

flipButton.addEventListener('click', function(e) {
    // Play sound (reset to start and handle blocked play) - use variant playback
    if (isMuted) {
        // do nothing when muted
    } else {
        // prefer WebAudio synthesized flip for variety
        try {
            playRandomFlip();
        } catch (e) {
            if (flipSound) {
                flipSound.currentTime = 0;
                flipSound.volume = volume;
                flipSound.play().catch(err => console.log('Audio play prevented or failed', err));
            }
        }
    }

    // Start polished animation
    if (coinWrap && coinShadow) {
        coinWrap.classList.add('animate-flip');
        coinShadow.classList.add('shadow-animate');
    }

    // Mid-animation result swap
    setTimeout(() => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        resultDisplay.textContent = result;

        // Update image (swap mid-flip)
        coinImage.src = isPirateMode ? (result === 'Heads' ? pirateHeadsImg : pirateTailsImg) : (result === 'Heads' ? headsImg : tailsImg);

        // Update stats
        totalFlips++;
        if (result === 'Heads') headsCount++;
        else tailsCount++;

        // Streak logic
        if (result === lastResult) {
            currentStreak++;
        } else {
            currentStreak = 1;
        }
        lastResult = result;

        // Update display with animated numbers
        animateNumber(document.getElementById('total-flips'), totalFlips);
        animateNumber(document.getElementById('heads-count'), headsCount);
        animateNumber(document.getElementById('tails-count'), tailsCount);
        animateNumber(document.getElementById('streak'), currentStreak);

        // Announce for screen readers
        if (sr) sr.textContent = `Flip result: ${result}`;

        // Spawn floating coin accent
        spawnFloatingCoin(result === 'Heads' ? 'assets/images/heads.png' : 'assets/images/tails.png');

        // Auto-save to local leaderboard if this is a top streak
        checkAndMaybeSave(currentStreak);

        // Confetti on 3-streak or 5-streak (progressive)
        if (currentStreak >= 5) {
            confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
        } else if (currentStreak >= 3) {
            confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        }
    }, 450); // mid-point of the animation

    // Cleanup animation classes after full animation
    setTimeout(() => {
        if (coinWrap && coinShadow) {
            coinWrap.classList.remove('animate-flip');
            coinShadow.classList.remove('shadow-animate');
        }
    }, 1100);
});

// Button ripple effect
document.querySelectorAll('button.ripple').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-el';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    });
});

// Volume and mute controls
const muteButton = document.getElementById('mute-button');
const volumeSlider = document.getElementById('volume-slider');

function updateVolumeUI() {
    volumeSlider.value = String(volume);
    muteButton.setAttribute('aria-pressed', String(isMuted));
    muteButton.textContent = isMuted ? '🔇' : (volume < 0.5 ? '🔈' : (volume < 0.9 ? '🔉' : '🔊'));
}

// Initialize UI from storage
updateVolumeUI();

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('coinMuted', String(isMuted));
    updateVolumeUI();
});

volumeSlider.addEventListener('input', (e) => {
    volume = Number(e.target.value);
    localStorage.setItem('coinVolume', String(volume));
    updateVolumeUI();
});

// Keyboard shortcuts: Space to flip, M to mute, Enter to flip
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); flipButton.click(); }
    if (e.key === 'm' || e.key === 'M') { muteButton.click(); }
});

// --- Shake-to-flip support ---
const shakeButton = document.getElementById('shake-button');
let shakeEnabled = localStorage.getItem('shakeEnabled') === 'true';
let shakeCooldown = false;

function updateShakeUI() {
    if (!shakeButton) return;
    shakeButton.setAttribute('aria-pressed', String(shakeEnabled));
}
updateShakeUI();

async function enableShake() {
    // On iOS 13+ we may need to request permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const res = await DeviceMotionEvent.requestPermission();
            if (res !== 'granted') { showToast('Permission denied for motion sensors'); shakeEnabled = false; updateShakeUI(); return; }
        } catch (e) {
            showToast('Motion permission request failed');
            shakeEnabled = false; updateShakeUI();
            return;
        }
    }

    if (!window._shakeListener) {
        let lastX = null, lastY = null, lastZ = null, lastTime = 0, shakeCount = 0;
        const threshold = 25; // tuned
        window._shakeListener = function(ev) {
            if (!shakeEnabled || shakeCooldown) return;
            const acc = ev.accelerationIncludingGravity || ev.acceleration || { x:0, y:0, z:0 };
            const x = acc.x || 0, y = acc.y || 0, z = acc.z || 0;
            if (lastX === null) { lastX = x; lastY = y; lastZ = z; lastTime = Date.now(); return; }
            const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
            const now = Date.now();
            if (delta > threshold) {
                if (now - lastTime < 1000) {
                    shakeCount++;
                } else {
                    shakeCount = 1;
                }
                if (shakeCount >= 2) {
                    // trigger flip
                    shakeCooldown = true;
                    flipButton.click();
                    // vibration feedback
                    if (navigator.vibrate) navigator.vibrate(40);
                    setTimeout(() => { shakeCooldown = false; }, 1200);
                    shakeCount = 0;
                }
                lastTime = now;
            }
            lastX = x; lastY = y; lastZ = z;
        };
        window.addEventListener('devicemotion', window._shakeListener);
    }
}

function disableShake() {
    if (window._shakeListener) {
        window.removeEventListener('devicemotion', window._shakeListener);
        window._shakeListener = null;
    }
}

shakeButton && shakeButton.addEventListener('click', async () => {
    shakeEnabled = !shakeEnabled;
    localStorage.setItem('shakeEnabled', String(shakeEnabled));
    updateShakeUI();
    if (shakeEnabled) {
        await enableShake();
        showToast('Shake to flip enabled');
    } else {
        disableShake();
        showToast('Shake to flip disabled');
    }
});

// If previously enabled, try to enable on load
if (shakeEnabled) {
    enableShake();
}

// Simple toast helper
function showToast(msg, timeout = 1600) {
    let t = document.querySelector('.toast');
    if (!t) {
        t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t);
    }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._dismiss);
    t._dismiss = setTimeout(() => t.classList.remove('show'), timeout);
}

// WebAudio procedural flip sound (synthesized short noise burst)
function ensureAudioContext() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// Create different procedural variants for variety
function playProceduralFlipVariant(variant = 0) {
    ensureAudioContext();
    const ctx = audioContext;
    const now = ctx.currentTime;

    // Parameters by variant
    const configs = [
        { dur: 0.12, hf: 1200, gain: 0.45 },
        { dur: 0.18, hf: 800, gain: 0.55 },
        { dur: 0.09, hf: 1600, gain: 0.35 },
    ];
    const cfg = configs[variant % configs.length];

    // white-noise buffer with quick decay
    const bufferSize = Math.floor(ctx.sampleRate * cfg.dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.6;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(cfg.gain * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.dur);

    const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = cfg.hf + Math.random() * 400;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8000;

    // small click transient using oscillator (adds 'edge' like a coin flick)
    const osc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    osc.frequency.value = 1500 + Math.random() * 600;
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(0.25 * volume, now + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    osc.connect(clickGain);

    src.connect(hf);
    hf.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    clickGain.connect(ctx.destination);

    src.start(now);
    osc.start(now);
    osc.stop(now + 0.03);
}

// Try to load external flip files if present (flip1.mp3, flip2.mp3, flip3.mp3, flip.mp3)
const externalFlipFiles = ['flip1.mp3','flip2.mp3','flip3.mp3','flip.mp3','flip1.wav','flip2.wav','flip3.wav'];
const externalSounds = [];
externalFlipFiles.forEach(name => {
    const a = new Audio(`assets/sounds/${name}`);
    a.preload = 'auto';
    a.volume = volume;
    a.addEventListener('canplaythrough', () => {
        externalSounds.push(a);
    }, { once: true });
    a.addEventListener('error', () => {
        // ignore if not present
    }, { once: true });
});

function playRandomFlip() {
    // If we have external sounds loaded, prefer them sometimes
    if (externalSounds.length > 0 && Math.random() < 0.7) {
        const s = externalSounds[Math.floor(Math.random() * externalSounds.length)];
        s.currentTime = 0;
        s.volume = volume;
        s.play().catch(err => console.log('External audio play prevented', err));
        return;
    }

    // Otherwise use procedural variants
    const variant = Math.floor(Math.random() * 3);
    playProceduralFlipVariant(variant);
}

// Play Sound button (for testing)
document.getElementById('play-sound-button').addEventListener('click', () => {
    if (!isMuted) playRandomFlip();
});

// Animated number helper
function animateNumber(el, to) {
    if (!el) return;
    const start = Number(el.textContent) || 0;
    const duration = 600;
    const startTime = performance.now();
    function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const val = Math.floor(start + (to - start) * t);
        el.textContent = val;
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// Floating coin accent
function spawnFloatingCoin(src) {
    const coin = document.createElement('img');
    coin.src = src;
    coin.className = 'floating-coin';
    coin.style.left = (window.innerWidth/2 + (Math.random()*160 - 80)) + 'px';
    coin.style.top = (window.innerHeight/2 + 40 + (Math.random()*40 - 20)) + 'px';
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 1700);
}

// ----------------- Leaderboard (localStorage) -----------------
const LEADERBOARD_KEY = 'coinLeaderboard';

function loadLeaderboard() {
    try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]'); } catch(e) { return []; }
}

function saveLeaderboard(list) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
    renderLeaderboard();
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    const list = loadLeaderboard();
    container.innerHTML = '';
    if (!list.length) { container.innerHTML = '<li class="muted">No scores yet</li>'; return; }
    list.forEach(entry => {
        const li = document.createElement('li');
        const name = document.createElement('span'); name.className = 'leaderboard-name'; name.textContent = entry.name;
        const score = document.createElement('span'); score.className = 'leaderboard-score'; score.textContent = entry.score;
        li.appendChild(name); li.appendChild(score);
        container.appendChild(li);
    });
}

function saveScoreToLeaderboard(name, score) {
    const list = loadLeaderboard();
    const entry = { name: name || 'Player', score: score, date: new Date().toISOString() };
    list.push(entry);
    list.sort((a,b) => b.score - a.score || new Date(a.date) - new Date(b.date));
    const top = list.slice(0,5);
    saveLeaderboard(top);
    showToast('Score saved to leaderboard');
}

function checkAndMaybeSave(score) {
    if (!score || score <= 0) return;
    const list = loadLeaderboard();
    if (list.length < 5 || score > list[list.length - 1].score) {
        const defaultName = 'You';
        const name = prompt('New high streak! Enter your name:', defaultName);
        if (name !== null) {
            saveScoreToLeaderboard(name.trim() || defaultName, score);
        }
    }
}

// render leaderboard on load
renderLeaderboard();

// Theme switcher (cycle between neon, pirate, minimal)
const themes = ['neon','pirate','minimal'];
const themeNames = { neon: 'Night Neon', pirate: 'Warm Pirate', minimal: 'Minimal Calm' };
function applyTheme(theme) {
    themes.forEach(t => document.body.classList.remove(`theme-${t}`));
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
    // Update label
    themeButton.textContent = `Theme: ${themeNames[theme]}`;
    // Pirate mode affects coin imagery
    isPirateMode = (theme === 'pirate');
    // Update coin image to match theme immediately
    coinImage.src = isPirateMode ? (lastResult === 'Heads' ? pirateHeadsImg : pirateTailsImg) : (lastResult === 'Heads' ? headsImg : tailsImg);
}

// Initialize theme from storage
const storedTheme = localStorage.getItem('theme') || 'neon';
applyTheme(storedTheme);

themeButton.addEventListener('click', function() {
    const idx = themes.indexOf(localStorage.getItem('theme') || 'neon');
    const next = themes[(idx + 1) % themes.length];
    applyTheme(next);
});

// Image load error fallback
coinImage.addEventListener('error', () => {
    console.warn('Coin image failed to load; using placeholder.');
    coinImage.src = 'https://via.placeholder.com/150/FFD700/000000?text=Coin';
});