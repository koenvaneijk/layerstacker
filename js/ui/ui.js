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
        
        // Create music toggle button
        this.createMusicToggle();
        
        // Load high score from local storage
        this.loadHighScore();
    },
    
    // Create music toggle button
    createMusicToggle: function() {
        const musicToggle = document.createElement('div');
        musicToggle.id = 'music-toggle';
        musicToggle.innerHTML = '<i class="fas fa-music"></i>';
        musicToggle.title = 'Toggle Music';
        musicToggle.classList.add('music-on');
        
        // Add click event
        musicToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isMuted = SoundManager.toggleMuteMusic();
            if (isMuted) {
                musicToggle.classList.remove('music-on');
                musicToggle.classList.add('music-off');
            } else {
                musicToggle.classList.remove('music-off');
                musicToggle.classList.add('music-on');
            }
        });
        
        document.getElementById('ui-container').appendChild(musicToggle);
    },
    
    // Show the start screen with animation
    showStartScreen: function() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Animate in
        gsap.fromTo(this.startScreen, 
            { opacity: 0, y: -30, scale: 0.95 },
            { 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                duration: 0.8, 
                ease: "back.out(1.4)"
            }
        );
    },
    
    // Hide the start screen with animation
    hideStartScreen: function() {
        gsap.to(this.startScreen, {
            opacity: 0,
            y: 30,
            scale: 0.95,
            duration: 0.5,
            ease: "back.in(1.4)",
            onComplete: () => {
                this.startScreen.classList.add('hidden');
            }
        });
    },
    
    // Show the game over screen with animation
    showGameOverScreen: function(score) {
        this.finalScoreElement.textContent = `Score: ${score}`;
        
        // Prepare the screen but keep it hidden
        this.gameOverScreen.style.opacity = 0;
        //this.gameOverScreen.style.transform = 'translate(-50%, -50%) scale(0.9)';
        this.gameOverScreen.classList.remove('hidden');
        
        // Check if it's a new high score
        const isNewHighScore = score > this.highScore;
        if (isNewHighScore) {
            this.highScore = score;
            this.saveHighScore();
            this.updateHighScoreDisplay();
            this.newHighScoreElement.classList.remove('hidden');
        } else {
            this.newHighScoreElement.classList.add('hidden');
        }
        
        // Create animation sequence
        const timeline = gsap.timeline({
            defaults: { duration: 0.7, ease: "back.out(1.4)" }
        });
        
        timeline.to(this.gameOverScreen, {
            opacity: 1,
            scale: 1,
            // transform: 'translate(-50%, -50%) scale(1)'
        });
        
        // Additional animation for new high score
        if (isNewHighScore) {
            timeline.from(this.newHighScoreElement, {
                scale: 0.5,
                opacity: 0,
                ease: "elastic.out(1, 0.5)",
                duration: 1,
                delay: 0.2
            });
        }
    },
    
    // Hide the game over screen with animation
    hideGameOverScreen: function() {
        gsap.to(this.gameOverScreen, {
            opacity: 0,
            y: 30,
            scale: 0.95,
            duration: 0.5,
            ease: "back.in(1.4)",
            onComplete: () => {
                this.gameOverScreen.classList.add('hidden');
            }
        });
    },
    
    // Update the current score display with animation
    updateScore: function(score) {
        const prevScore = parseInt(this.currentScoreElement.textContent) || 0;
        
        // Don't animate if it's just initializing to 0
        if (prevScore === 0 && score === 0) {
            this.currentScoreElement.textContent = score;
            return;
        }
        
        // Animate the score counting up
        const duration = 0.5;
        const startTime = performance.now();
        const updateDisplay = (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000; // seconds
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smoother animation
            const easeOutQuad = function(t) { return t * (2 - t); };
            const easedProgress = easeOutQuad(progress);
            
            // Calculate current display value
            const currentValue = Math.floor(prevScore + (score - prevScore) * easedProgress);
            this.currentScoreElement.textContent = currentValue;
            
            // Apply scale effect
            const scale = 1 + (1 - progress) * 0.2; // Scale from 1.2 to 1.0
            this.currentScoreElement.style.transform = `scale(${scale})`;
            this.currentScoreElement.style.color = progress < 1 ? '#ffcc00' : '#ffffff';
            
            if (progress < 1) {
                requestAnimationFrame(updateDisplay);
            } else {
                // Reset styles when done
                setTimeout(() => {
                    this.currentScoreElement.style.transform = '';
                    this.currentScoreElement.style.color = '';
                }, 200);
            }
        };
        
        requestAnimationFrame(updateDisplay);
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
