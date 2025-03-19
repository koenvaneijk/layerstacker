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

// Create sound files if they don't exist
function createSoundFiles() {
    // This function would normally create or download sound files
    // For this implementation, we'll just log a message
    console.log("Sound files would be created here in a real implementation");
    
    // In a real implementation, you would create the following files:
    // - assets/sounds/place.mp3
    // - assets/sounds/perfect.mp3
    // - assets/sounds/gameover.mp3
}

// Create directories if they don't exist
function createDirectories() {
    // This would create the necessary directories in a real file system
    console.log("Directories would be created here in a real implementation");
    
    // In a real implementation, you would create:
    // - assets/sounds/
}

// Initialize directories and sound files
createDirectories();
createSoundFiles();
