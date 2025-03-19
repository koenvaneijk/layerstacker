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
    
    // Music players and sequences
    music: {
        menuLoop: null,
        gameLoop: null,
        gameOverLoop: null,
        currentLoop: null,
        volume: -12, // Default volume in dB
        muted: false
    },
    
    // Initialize the sound manager
    init: function() {
        if (this.initialized) return;
        
        // We'll initialize Tone.js context on the first user interaction
        // Create synths for each sound effect but don't start the AudioContext yet
        this.createPlaceSound();
        this.createPerfectSound();
        this.createGameOverSound();
        
        // Initialize music tracks
        this.createMusicTracks();
        
        // Modern versions of Tone.js don't need suspend() - they start in suspended state
        // We'll start the context on user interaction
        
        this.initialized = true;
    },
    
    // Start audio context on user interaction
    startAudioContext: function() {
        if (Tone.context.state !== "running") {
            Tone.start();
        }
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
        // Play a short note
        this.synths.place.triggerAttackRelease("C3", "16n");
    },
    
    // Play the perfect sound
    playPerfectSound: function() {
        // Play a cheerful chord sequence
        const now = Tone.now();
        this.synths.perfect.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
        this.synths.perfect.triggerAttackRelease(["C5", "E5", "G5"], "8n", now + 0.1);
    },
    
    // Play the game over sound
    playGameOverSound: function() {
        
        // Play a descending pattern
        const now = Tone.now();
        this.synths.gameOver.triggerAttackRelease("A3", "8n", now);
        this.synths.gameOver.triggerAttackRelease("E3", "8n", now + 0.2);
        this.synths.gameOver.triggerAttackRelease("A2", "4n", now + 0.4);
    },
    
    // Create all music tracks
    createMusicTracks: function() {
        // Create a volume node for all music
        this.musicVolume = new Tone.Volume(this.music.volume).toDestination();
        
        // Create menu music - calm, atmospheric
        this.createMenuMusic();
        
        // Create gameplay music - more energetic, builds up
        this.createGameplayMusic();
        
        // Create game over music - reflective, a bit sad
        this.createGameOverMusic();
    },
    
    // Create the menu background music
    createMenuMusic: function() {
        // Create instruments
        const synthPad = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.8,
                decay: 0.2,
                sustain: 0.8,
                release: 1.5
            }
        }).connect(this.musicVolume);
        
        const bassSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.7,
                release: 0.8
            }
        }).connect(this.musicVolume);
        
        // Add effects
        const reverb = new Tone.Reverb({
            decay: 4,
            wet: 0.6
        }).connect(this.musicVolume);
        synthPad.connect(reverb);
        
        // Create chord sequence
        const chords = [
            ["E3", "G3", "B3", "D4"], // Em7
            ["A3", "C4", "E4"],       // Am
            ["D3", "F3", "A3", "C4"], // Dm7
            ["G3", "B3", "D4"]        // G
        ];
        
        const bassNotes = ["E2", "A2", "D2", "G2"];
        
        // Create sequences
        const padSequence = new Tone.Sequence((time, chord) => {
            synthPad.triggerAttackRelease(chord, "2n", time);
        }, chords, "1m").start(0);
        
        const bassSequence = new Tone.Sequence((time, note) => {
            bassSynth.triggerAttackRelease(note, "2n", time);
        }, bassNotes, "1m").start(0);
        
        // Create ambient arpeggios
        const arpSynth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.02,
                decay: 0.2,
                sustain: 0.4,
                release: 0.5
            }
        }).connect(reverb);
        
        const arpNotes = ["E5", "B4", "G4", "B4", "E5", "G5", "B5", "G5"];
        const arpSequence = new Tone.Sequence((time, note) => {
            arpSynth.triggerAttackRelease(note, "8n", time);
        }, arpNotes, "8n").start(0);
        
        // Store all components for later control
        this.music.menuLoop = {
            synthPad,
            bassSynth,
            arpSynth,
            reverb,
            sequences: [padSequence, bassSequence, arpSequence],
            bpm: 70
        };
        
        // Set initial state (stopped)
        padSequence.stop();
        bassSequence.stop();
        arpSequence.stop();
    },
    
    // Create the gameplay background music
    createGameplayMusic: function() {
        // Create instruments for an energetic, electronic feel
        const leadSynth = new Tone.Synth({
            oscillator: { type: "square8" },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.2,
                release: 0.4
            }
        }).connect(this.musicVolume);
        
        const chordSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.05,
                decay: 0.3,
                sustain: 0.3,
                release: 0.4
            }
        }).connect(this.musicVolume);
        
        const bassSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.8,
                release: 0.4
            }
        }).connect(this.musicVolume);
        
        // Add effects
        const delay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.2,
            wet: 0.2
        }).connect(this.musicVolume);
        
        leadSynth.connect(delay);
        
        // Define sequences
        const bassPattern = ["C2", ["C2", "C3"], "G2", ["G2", "G3"], 
                             "A#2", ["A#2", "A#3"], "F2", ["F2", "F3"]];
        
        const chordPattern = [
            ["C3", "E3", "G3"], null, ["C3", "E3", "G3"], null,
            ["G2", "B2", "D3"], null, ["G2", "B2", "D3"], null,
            ["A#2", "D3", "F3"], null, ["A#2", "D3", "F3"], null,
            ["F2", "A2", "C3"], null, ["F2", "A2", "C3"], null
        ];
        
        const leadPattern = [
            null, "G4", "E4", "G4", 
            "C5", "B4", "G4", "E4",
            null, "G4", "D4", "G4", 
            "B4", "A4", "F4", "D4"
        ];
        
        // Create sequences
        const bassSequence = new Tone.Sequence((time, note) => {
            if (Array.isArray(note)) {
                // Play as arpeggio
                note.forEach((n, i) => {
                    bassSynth.triggerAttackRelease(n, "16n", time + i * 0.1);
                });
            } else if (note) {
                bassSynth.triggerAttackRelease(note, "8n", time);
            }
        }, bassPattern, "4n").start(0);
        
        const chordSequence = new Tone.Sequence((time, chord) => {
            if (chord) {
                chordSynth.triggerAttackRelease(chord, "8n", time);
            }
        }, chordPattern, "8n").start(0);
        
        const leadSequence = new Tone.Sequence((time, note) => {
            if (note) {
                leadSynth.triggerAttackRelease(note, "16n", time);
            }
        }, leadPattern, "8n").start(0);
        
        // Add drums
        const drumSampler = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.01,
                release: 0.5
            }
        }).connect(this.musicVolume);
        
        const hihatSynth = new Tone.NoiseSynth({
            volume: -15,
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0,
                release: 0.07
            }
        }).connect(this.musicVolume);
        
        // Simple kick and hihat pattern
        const kickPattern = ["C1", null, "C1", null, "C1", null, "C1", null];
        const hihatPattern = [null, "C3", null, "C3", null, "C3", null, "C3"];
        
        const kickSequence = new Tone.Sequence((time) => {
            drumSampler.triggerAttackRelease("C1", "8n", time);
        }, kickPattern, "8n").start(0);
        
        const hihatSequence = new Tone.Sequence((time) => {
            hihatSynth.triggerAttackRelease("16n", time);
        }, hihatPattern, "8n").start(0);
        
        // Store all components
        this.music.gameLoop = {
            leadSynth,
            chordSynth,
            bassSynth,
            drumSampler,
            hihatSynth,
            delay,
            sequences: [bassSequence, chordSequence, leadSequence, kickSequence, hihatSequence],
            bpm: 110
        };
        
        // Set initial state (stopped)
        bassSequence.stop();
        chordSequence.stop();
        leadSequence.stop();
        kickSequence.stop();
        hihatSequence.stop();
    },
    
    // Create game over music
    createGameOverMusic: function() {
        // Melancholic piano
        const piano = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.7,
                release: 2
            }
        }).connect(this.musicVolume);
        
        // Add reverb for more emotional feel
        const reverb = new Tone.Reverb({
            decay: 5,
            wet: 0.7
        }).connect(this.musicVolume);
        
        piano.connect(reverb);
        
        // Slow, melancholic melody
        const melodyNotes = [
            "E4", "B3", "C4", "D4", 
            "E4", "B3", "A3", null, 
            "D4", "A3", "B3", "C4", 
            "D4", "A3", "G3", null
        ];
        
        const melodyTiming = [
            "4n", "8n", "8n", "4n",
            "4n", "8n", "2n", "8n",
            "4n", "8n", "8n", "4n",
            "4n", "8n", "2n", "8n"
        ];
        
        // Create sequence with note durations
        const melodySequence = new Tone.Sequence((time, note, index) => {
            if (note) {
                piano.triggerAttackRelease(note, melodyTiming[index], time);
            }
        }, melodyNotes, "4n").start(0);
        
        // Store components
        this.music.gameOverLoop = {
            piano,
            reverb,
            sequences: [melodySequence],
            bpm: 60
        };
        
        // Set initial state (stopped)
        melodySequence.stop();
    },
    
    // Start menu music
    playMenuMusic: function() {
        this.stopMusic();
        
        // Set tempo
        Tone.Transport.bpm.value = this.music.menuLoop.bpm;
        
        // Start sequences
        this.music.menuLoop.sequences.forEach(seq => seq.start());
        
        // Start transport if needed
        Tone.Transport.start();
        
        // Store reference to current loop
        this.music.currentLoop = "menu";
    },
    
    // Start gameplay music
    playGameMusic: function() {
        this.stopMusic();
        
        // Set tempo
        Tone.Transport.bpm.value = this.music.gameLoop.bpm;
        
        // Start sequences
        this.music.gameLoop.sequences.forEach(seq => seq.start());
        
        // Start transport if needed
        Tone.Transport.start();
        
        // Store reference to current loop
        this.music.currentLoop = "game";
    },
    
    // Start game over music
    playGameOverMusic: function() {
        this.stopMusic();
        
        // Set tempo
        Tone.Transport.bpm.value = this.music.gameOverLoop.bpm;
        
        // Start sequences
        this.music.gameOverLoop.sequences.forEach(seq => seq.start());
        
        // Start transport if needed
        Tone.Transport.start();
        
        // Store reference to current loop
        this.music.currentLoop = "gameOver";
    },
    
    // Stop all music
    stopMusic: function() {
        if (this.music.menuLoop) {
            this.music.menuLoop.sequences.forEach(seq => seq.stop());
        }
        
        if (this.music.gameLoop) {
            this.music.gameLoop.sequences.forEach(seq => seq.stop());
        }
        
        if (this.music.gameOverLoop) {
            this.music.gameOverLoop.sequences.forEach(seq => seq.stop());
        }
        
        // Don't stop transport as it may be used by sound effects
        this.music.currentLoop = null;
    },
    
    // Toggle mute status for music
    toggleMuteMusic: function() {
        this.music.muted = !this.music.muted;
        
        if (this.music.muted) {
            this.musicVolume.volume.value = -Infinity;
        } else {
            this.musicVolume.volume.value = this.music.volume;
        }
        
        return this.music.muted;
    },
    
    // Set music volume
    setMusicVolume: function(volumeDb) {
        this.music.volume = volumeDb;
        
        if (!this.music.muted) {
            this.musicVolume.volume.value = volumeDb;
        }
    }
};
