/**
 * Main game logic for the Layer Stacker game
 * 100% vibe-coded with AI by Koen van Eijk (vaneijk.koen@gmail.com)
 */
const Game = {
    isRunning: false,
    score: 0,
    lastTime: 0,
    
    // Sound effects are now handled by SoundManager
    
    // Initialize the game
    init: function() {
        // Initialize components
        GameRenderer.init();
        InputHandler.init(this);
        UI.init(this);
        Physics.init();
        
        // Initialize tower
        this.tower = new Tower();
        
        // Initialize sounds
        this.initSounds();
        
        // Show start screen
        UI.showStartScreen();
        
        // Start background music for menu
        SoundManager.startAudioContext();
        SoundManager.playMenuMusic();
        
        // Start animation loop
        this.animate();
    },
    
    // Initialize sound effects
    initSounds: function() {
        // Initialize the sound manager
        SoundManager.init();
    },
    
    // Play a sound effect
    playSound: function(soundName) {
        // Start audio context on first user interaction
        SoundManager.startAudioContext();
        
        // Play the requested sound
        switch(soundName) {
            case 'place':
                SoundManager.playPlaceSound();
                break;
            case 'perfect':
                SoundManager.playPerfectSound();
                break;
            case 'gameOver':
                SoundManager.playGameOverSound();
                break;
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
        
        // Switch from menu to game music
        SoundManager.playGameMusic();
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
        // Remove all meshes from the scene except environment elements
        for (let i = GameRenderer.scene.children.length - 1; i >= 0; i--) {
            const object = GameRenderer.scene.children[i];
            // Keep objects tagged as environment, animated objects, and the first few objects (lights, ground)
            if (object.userData && (object.userData.isEnvironment || object.userData.isAnimated)) {
                continue; // Skip environment and animated objects
            }
            // Also preserve the first 3 objects which are usually lights and ground
            if (i < 3) {
                continue;
            }
            GameRenderer.scene.remove(object);
        }
        
        // Reset physics
        Physics.reset();
        
        // Reset clock to ensure animations continue properly
        GameRenderer.clock = new THREE.Clock();
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
        
        // Switch to game over music
        SoundManager.playGameOverMusic();
        
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
