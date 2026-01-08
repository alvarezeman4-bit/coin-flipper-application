# Mobile Background Glitch Fix - TODO

## Steps to Fix Background Color Glitch on Mobile

### Step 1: Fix viewport height for mobile
- [x] Replace `min-height: 100vh` with `min-height: 100dvh` for dynamic viewport height
- [x] Add fallback for older browsers (`-webkit-fill-available`)

### Step 2: Add smooth theme transitions
- [x] Add CSS transitions for background and color properties (0.4s ease)
- [x] Add hardware acceleration hints (`translateZ(0)`)

### Step 3: Define all three theme color schemes
- [x] Define `theme-neon` colors (current default)
- [x] Define `theme-pirate` colors (warm tones)
- [x] Define `theme-minimal` colors (calm/neutral)

### Step 4: Test the changes
- [ ] Verify mobile viewport behavior
- [ ] Verify theme transitions are smooth

