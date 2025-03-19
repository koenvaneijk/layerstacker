/**
 * Input handler for the Layer Stacker game
 */
const InputHandler = {
    isEnabled: false,
    touchStarted: false,
    
    // Initialize input handlers
    init: function(game) {
        this.game = game;
        this.setupEventListeners();
    },
    
    // Set up event listeners for mouse and touch
    setupEventListeners: function() {
        const canvas = document.getElementById('game-canvas');
        const uiContainer = document.getElementById('ui-container');
        
        // Mouse events
        canvas.addEventListener('click', this.handleInput.bind(this));
        
        // Touch events
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // UI events
        uiContainer.addEventListener('click', this.handleUIClick.bind(this));
        uiContainer.addEventListener('touchend', this.handleUITouch.bind(this));
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length === 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    },
    
    // Enable input
    enable: function() {
        this.isEnabled = true;
    },
    
    // Disable input
    disable: function() {
        this.isEnabled = false;
    },
    
    // Handle mouse click
    handleInput: function(e) {
        if (!this.isEnabled) return;
        
        e.preventDefault();
        this.game.onPlayerInput();
    },
    
    // Handle touch start
    handleTouchStart: function(e) {
        if (!this.isEnabled) return;
        
        e.preventDefault();
        this.touchStarted = true;
    },
    
    // Handle touch end
    handleTouchEnd: function(e) {
        if (!this.isEnabled || !this.touchStarted) return;
        
        e.preventDefault();
        this.touchStarted = false;
        this.game.onPlayerInput();
    },
    
    // Handle UI clicks
    handleUIClick: function(e) {
        const target = e.target;
        
        if (target.classList.contains('start-button')) {
            this.game.start();
        } else if (target.classList.contains('restart-button')) {
            this.game.restart();
        }
    },
    
    // Handle UI touch
    handleUITouch: function(e) {
        const target = e.target;
        
        if (target.classList.contains('start-button')) {
            e.preventDefault();
            this.game.start();
        } else if (target.classList.contains('restart-button')) {
            e.preventDefault();
            this.game.restart();
        }
    }
};
