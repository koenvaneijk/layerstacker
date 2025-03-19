/**
 * Main game logic for the Layer Stacker game
 */
const Game = {
    isRunning: false,
    score: 0,
    lastTime: 0,
    
    // Sound effects
    sounds: {
        place: null,
        perfect: null,
        gameOver: null
    },
    
    // Initialize the game
    init: function() {
        // Initialize components
        GameRenderer.init();
        InputHandler.init(this);
        UI.init(this);
        Physics.init();
        
        // Initialize tower
        this.tower = new Tower();
        
        // Load sounds
        this.loadSounds();
        
        // Show start screen
        UI.showStartScreen();
        
        // Start animation loop
        this.animate();
    },
    
    // Load sound effects
    loadSounds: function() {
        // Simple audio implementation
        this.sounds.place = new Audio('assets/sounds/place.mp3');
        this.sounds.perfect = new Audio('assets/sounds/perfect.mp3');
        this.sounds.gameOver = new Audio('assets/sounds/gameover.mp3');
        
        // Preload sounds
        for (const sound in this.sounds) {
            if (this.sounds[sound]) {
                this.sounds[sound].load();
            }
        }
    },
    
    // Play a sound effect
    playSound: function(soundName) {
        if (this.sounds[soundName]) {
            // Reset and play
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => {
                console.log("Audio play failed:", e);
            });
        }
    },
    
    // Start the game
    start: function() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.score = 0;
        
        UI.hideStartScreen();
        UI.reset();
        UI.updateScore(this.score);
        
        // Reset physics
        Physics.reset();
        
        // Initialize tower
        this.tower.init(GameRenderer.scene);
        
        // Set camera position
        GameRenderer.setCameraPosition(0);
        
        // Enable input
        InputHandler.enable();
    },
    
    // Restart the game
    restart: function() {
        // Clean up current game
        this.cleanUp();
        
        // Start a new game
        this.start();
    },
    
    // Clean up game objects
    cleanUp: function() {
        // Remove all meshes from the scene except environment
        while (GameRenderer.scene.children.length > 3) { // Keep lights and ground
            const object = GameRenderer.scene.children[3];
            GameRenderer.scene.remove(object);
        }
        
        // Reset physics
        Physics.reset();
    },
    
    // Handle player input (tap/click)
    onPlayerInput: function() {
        if (!this.isRunning) return;
        
        const result = this.tower.placeCurrentLayer(GameRenderer.scene);
        
        if (!result) return;
        
        if (result.success) {
            // Increment score
            this.score++;
            UI.updateScore(this.score);
            
            // Move camera to follow tower height
            GameRenderer.animateCameraToPosition(this.tower.getHeight());
            
            // Check for perfect match
            if (result.perfectMatch) {
                // Play perfect sound
                this.playSound('perfect');
                
                // Create particle effect
                const lastLayer = this.tower.getLastLayer();
                GameRenderer.createPerfectStackEffect(lastLayer.mesh.position);
            } else {
                // Play regular place sound
                this.playSound('place');
            }
        } else {
            // Game over
            this.gameOver();
        }
    },
    
    // Game over
    gameOver: function() {
        this.isRunning = false;
        InputHandler.disable();
        
        // Play game over sound
        this.playSound('gameOver');
        
        // Shake camera
        GameRenderer.shakeCamera(1, 0.5);
        
        // Show game over screen after a short delay
        setTimeout(() => {
            UI.showGameOverScreen(this.score);
        }, 1500);
    },
    
    // Animation loop
    animate: function(time = 0) {
        requestAnimationFrame(this.animate.bind(this));
        
        // Calculate delta time
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        // Limit delta to avoid large jumps
        const cappedDelta = Math.min(delta, 0.1);
        
        // Update game logic
        if (this.isRunning) {
            this.tower.update(cappedDelta);
            Physics.update(cappedDelta);
        }
        
        // Render the scene
        GameRenderer.render();
    }
};
