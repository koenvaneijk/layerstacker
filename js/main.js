/**
 * Entry point for the Layer Stacker game
 */
window.addEventListener('load', function() {
    // Initialize the game
    Game.init();
});

// Prevent scrolling on touch devices
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Sound is now generated using Tone.js, no need for sound files
