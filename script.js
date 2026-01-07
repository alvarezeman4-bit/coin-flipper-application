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

// Keyboard shortcuts: Space to flip, M to mute
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); flipButton.click(); }
    if (e.key === 'm' || e.key === 'M') { muteButton.click(); }
});

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

themeButton.addEventListener('click', function() {
    isPirateMode = !isPirateMode;
    document.body.classList.toggle('pirate');
    themeButton.textContent = isPirateMode ? 'Switch to Classic Mode' : 'Switch to Pirate Mode';
    // Update coin image immediately
    coinImage.src = isPirateMode ? (lastResult === 'Heads' ? pirateHeadsImg : pirateTailsImg) : (lastResult === 'Heads' ? headsImg : tailsImg);
});

// Image load error fallback
coinImage.addEventListener('error', () => {
    console.warn('Coin image failed to load; using placeholder.');
    coinImage.src = 'https://via.placeholder.com/150/FFD700/000000?text=Coin';
});