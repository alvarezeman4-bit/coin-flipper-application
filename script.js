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

// Image paths (put your images in assets/images/)
const headsImg = 'assets/images/coin-heads.png';
const headsImg2x = 'assets/images/coin-heads@2x.png';
const tailsImg = 'assets/images/coin-tails.png';
const pirateHeadsImg = 'assets/images/pirate-heads.png';
const pirateTailsImg = 'assets/images/pirate-tails.png';

// Preload images to avoid flicker
[headsImg, headsImg2x, tailsImg, pirateHeadsImg, pirateTailsImg].forEach(src => {
    const img = new Image();
    img.src = src;
});

flipButton.addEventListener('click', function() {
    // Play sound (reset to start and handle blocked play)
    if (flipSound) {
        flipSound.currentTime = 0;
        flipSound.play().catch(err => console.log('Audio play prevented or failed', err));
    }

    // Add spin animation
    coinImage.classList.add('flip-animation');
    setTimeout(() => coinImage.classList.remove('flip-animation'), 500);

    // Generate result after animation
    setTimeout(() => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        resultDisplay.textContent = result;

        // Update image
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

        // Confetti on 5-streak
        if (currentStreak >= 5) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }, 250); // Delay to sync with animation
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