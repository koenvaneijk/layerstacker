/**
 * Sound utilities for the Layer Stacker game using Tone.js
 */
const SoundManager = {
    initialized: false,
    
    // Synths for different sound effects
    synths: {
        place: null,
        perfect: null,
        gameOver: null
    },
    
    // Initialize the sound manager
    init: function() {
        if (this.initialized) return;
        
        // Create synths for each sound effect
        this.createPlaceSound();
        this.createPerfectSound();
        this.createGameOverSound();
        
        this.initialized = true;
    },
    
    // Create a synth for the place sound (short click/tap sound)
    createPlaceSound: function() {
        this.synths.place = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0,
                release: 0.1
            }
        }).toDestination();
    },
    
    // Create a synth for the perfect sound (cheerful success sound)
    createPerfectSound: function() {
        // Create a polyphonic synth for chords
        this.synths.perfect = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.2,
                release: 0.5
            }
        }).toDestination();
        
        // Add a little reverb
        const reverb = new Tone.Reverb({
            decay: 1.5,
            wet: 0.3
        }).toDestination();
        
        this.synths.perfect.connect(reverb);
    },
    
    // Create a synth for the game over sound (descending sad sound)
    createGameOverSound: function() {
        this.synths.gameOver = new Tone.Synth({
            oscillator: {
                type: "sawtooth"
            },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.3,
                release: 1.5
            }
        }).toDestination();
        
        // Add distortion for a more dramatic effect
        const distortion = new Tone.Distortion({
            distortion: 0.4,
            wet: 0.2
        }).toDestination();
        
        this.synths.gameOver.connect(distortion);
    },
    
    // Play the place sound
    playPlaceSound: function() {
        // Make sure Tone.js is started
        if (Tone.context.state !== "running") {
            Tone.start();
        }
        
        // Play a short note
        this.synths.place.triggerAttackRelease("C3", "16n");
    },
    
    // Play the perfect sound
    playPerfectSound: function() {
        // Make sure Tone.js is started
        if (Tone.context.state !== "running") {
            Tone.start();
        }
        
        // Play a cheerful chord sequence
        const now = Tone.now();
        this.synths.perfect.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
        this.synths.perfect.triggerAttackRelease(["C5", "E5", "G5"], "8n", now + 0.1);
    },
    
    // Play the game over sound
    playGameOverSound: function() {
        // Make sure Tone.js is started
        if (Tone.context.state !== "running") {
            Tone.start();
        }
        
        // Play a descending pattern
        const now = Tone.now();
        this.synths.gameOver.triggerAttackRelease("A3", "8n", now);
        this.synths.gameOver.triggerAttackRelease("E3", "8n", now + 0.2);
        this.synths.gameOver.triggerAttackRelease("A2", "4n", now + 0.4);
    }
};
