/**
 * Color utilities for the Layer Stacker game
 */
const Colors = {
    // Color palette for layers
    layerColors: [
        0x3498db, // Blue
        0x2ecc71, // Green
        0xe74c3c, // Red
        0xf39c12, // Orange
        0x9b59b6, // Purple
        0x1abc9c, // Teal
        0xd35400, // Dark Orange
        0x2980b9, // Dark Blue
        0x27ae60, // Dark Green
        0x8e44ad  // Dark Purple
    ],
    
    // Background gradient colors
    backgroundTop: 0x1a1a2e,
    backgroundBottom: 0x16213e,
    
    // UI colors
    uiHighlight: 0x4a4ae9,
    
    // Get a color for a specific layer index
    getColorForLayer: function(index) {
        return this.layerColors[index % this.layerColors.length];
    },
    
    // Get a slightly darker version of a color (for shadows or variations)
    getDarkerColor: function(color, factor = 0.8) {
        const r = ((color >> 16) & 255) * factor;
        const g = ((color >> 8) & 255) * factor;
        const b = (color & 255) * factor;
        return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
    },
    
    // Get a slightly lighter version of a color
    getLighterColor: function(color, factor = 1.2) {
        const r = Math.min(255, ((color >> 16) & 255) * factor);
        const g = Math.min(255, ((color >> 8) & 255) * factor);
        const b = Math.min(255, (color & 255) * factor);
        return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
    }
};
