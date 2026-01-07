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

        // Update display
        document.getElementById('total-flips').textContent = totalFlips;
        document.getElementById('heads-count').textContent = headsCount;
        document.getElementById('tails-count').textContent = tailsCount;
        document.getElementById('streak').textContent = currentStreak;

        // Announce for screen readers
        if (sr) sr.textContent = `Flip result: ${result}`;

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

function playProceduralFlip() {
    ensureAudioContext();
    const ctx = audioContext;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.15; // 150ms noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5; // decaying white noise
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 900 + Math.random() * 1200;
    src.connect(hf);
    hf.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
}

function playRandomFlip() {
    // Randomly pick procedural or file-based
    if (Math.random() < 0.6) {
        playProceduralFlip();
    } else if (flipSound) {
        flipSound.currentTime = 0;
        flipSound.volume = volume;
        flipSound.play().catch(err => console.log('Audio play prevented', err));
    }
}

// Play Sound button (for testing)
document.getElementById('play-sound-button').addEventListener('click', () => {
    if (!isMuted) playRandomFlip();
});

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