/**
 * Color utilities for the Layer Stacker game
 */
const Colors = {
    // Modern harmonious color palette for layers
    layerColors: [
        0x4a4ae9, // Electric Blue (primary brand color)
        0x50c5b7, // Turquoise
        0x6a67ce, // Purple
        0xff9166, // Coral
        0xffbf00, // Amber
        0xff6b95, // Pink
        0x06d6a0, // Mint
        0x118ab2, // Ocean Blue
        0x9381ff, // Lavender
        0xef476f  // Raspberry
    ],
    
    // Color schemes for different game themes
    colorSchemes: {
        default: {
            primary: 0x4a4ae9,
            secondary: 0x50c5b7,
            accent: 0xff6b95,
            background: 0x0a1029
        },
        sunset: {
            primary: 0xff9166,
            secondary: 0xef476f,
            accent: 0xffbf00,
            background: 0x1a0a29
        },
        ocean: {
            primary: 0x118ab2,
            secondary: 0x06d6a0,
            accent: 0x4a4ae9,
            background: 0x0a192f
        }
    },
    
    // Active color scheme - can be changed at runtime
    activeScheme: 'default',
    
    // Background gradient colors
    backgroundTop: 0x0a1029,
    backgroundBottom: 0x16213e,
    
    // UI colors
    uiHighlight: 0x4a4ae9,
    
    // Get current theme color
    getThemeColor: function(colorName) {
        return this.colorSchemes[this.activeScheme][colorName];
    },
    
    // Generate a rainbow color based on progress (0-1)
    getRainbowColor: function(progress) {
        // Hue rotation (0-1) mapped to the color wheel (0-360)
        const hue = progress * 360;
        return this.hslToHex(hue / 360, 0.8, 0.6);
    },
    
    // Convert HSL to hex color
    hslToHex: function(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = function(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = function(x) {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        const hexValue = '0x' + toHex(r) + toHex(g) + toHex(b);
        return parseInt(hexValue, 16);
    },
    
    // Get a color for a specific layer index with enhanced visuals
    getColorForLayer: function(index) {
        // We can either use the palette or generate colors procedurally
        if (this.useProceduralColors) {
            // Generate colors that flow through a pleasing gradient
            return this.getRainbowColor(index / 20); // Cycle through colors every 20 layers
        } else {
            // Or use our handpicked palette
            return this.layerColors[index % this.layerColors.length];
        }
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
