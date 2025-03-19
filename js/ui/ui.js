/**
 * UI manager for the Layer Stacker game
 */
const UI = {
    // Initialize UI elements
    init: function(game) {
        this.game = game;
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.currentScoreElement = document.getElementById('current-score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.newHighScoreElement = document.getElementById('new-high-score');
        
        // Load high score from local storage
        this.loadHighScore();
    },
    
    // Show the start screen
    showStartScreen: function() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    },
    
    // Hide the start screen
    hideStartScreen: function() {
        this.startScreen.classList.add('hidden');
    },
    
    // Show the game over screen
    showGameOverScreen: function(score) {
        this.finalScoreElement.textContent = `Score: ${score}`;
        
        // Check if it's a new high score
        if (score > this.highScore) {
            this.highScore = score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
            this.newHighScoreElement.classList.remove('hidden');
        } else {
            this.newHighScoreElement.classList.add('hidden');
        }
        
        this.gameOverScreen.classList.remove('hidden');
    },
    
    // Hide the game over screen
    hideGameOverScreen: function() {
        this.gameOverScreen.classList.add('hidden');
    },
    
    // Update the current score display
    updateScore: function(score) {
        this.currentScoreElement.textContent = score;
    },
    
    // Update the high score display
    updateHighScoreDisplay: function() {
        this.highScoreElement.textContent = `Best: ${this.highScore}`;
    },
    
    // Load high score from local storage
    loadHighScore: function() {
        const savedHighScore = localStorage.getItem('layerStackerHighScore');
        this.highScore = savedHighScore ? parseInt(savedHighScore) : 0;
        this.updateHighScoreDisplay();
    },
    
    // Save high score to local storage
    saveHighScore: function() {
        localStorage.setItem('layerStackerHighScore', this.highScore.toString());
    },
    
    // Reset the UI
    reset: function() {
        this.updateScore(0);
        this.hideGameOverScreen();
    }
};
