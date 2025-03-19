/**
 * Tower class for managing the stack of layers
 */
class Tower {
    constructor() {
        this.layers = [];
        this.currentLayer = null;
        this.baseWidth = 5;
        this.baseDepth = 5;
        this.layerHeight = 0.8;
        this.baseY = 0;
        this.currentSpeed = 5; // Initial speed
        this.speedIncrement = 0.5; // How much to increase speed
        this.speedIncrementLevels = 5; // Increase speed every X levels
        this.direction = 1; // Initial direction (1 = right, -1 = left)
    }
    
    // Initialize the tower with a base layer
    init(scene) {
        this.reset();
        
        // Create base layer
        const baseLayer = new Layer(
            this.baseWidth,
            this.baseDepth,
            this.layerHeight,
            new THREE.Vector3(0, this.baseY, 0),
            Colors.getColorForLayer(0)
        );
        
        scene.add(baseLayer.mesh);
        this.layers.push(baseLayer);
        
        // Create and start the first moving layer
        this.createNextLayer(scene);
    }
    
    // Reset the tower
    reset() {
        this.layers = [];
        this.currentLayer = null;
        this.currentSpeed = 5;
        this.direction = 1;
    }
    
    // Create the next layer and start it moving
    createNextLayer(scene) {
        const lastLayer = this.getLastLayer();
        const layerIndex = this.layers.length;
        
        // Alternate direction
        this.direction *= -1;
        
        // Increase speed every few levels
        if (layerIndex > 0 && layerIndex % this.speedIncrementLevels === 0) {
            this.currentSpeed += this.speedIncrement;
        }
        
        // Create new layer with same dimensions as the last placed layer
        const newLayer = new Layer(
            lastLayer.width,
            lastLayer.depth,
            this.layerHeight,
            new THREE.Vector3(
                this.direction > 0 ? -10 : 10, // Start position based on direction
                lastLayer.position.y + this.layerHeight,
                lastLayer.position.z
            ),
            Colors.getColorForLayer(layerIndex)
        );
        
        // Start the layer moving
        newLayer.startMoving(this.currentSpeed, this.direction);
        
        scene.add(newLayer.mesh);
        this.currentLayer = newLayer;
        
        return newLayer;
    }
    
    // Get the last placed layer
    getLastLayer() {
        return this.layers[this.layers.length - 1];
    }
    
    // Place the current moving layer
    placeCurrentLayer(scene) {
        if (!this.currentLayer || !this.currentLayer.moving) {
            return null;
        }
        
        // Stop the layer from moving
        this.currentLayer.stopMoving();
        
        const previousLayer = this.getLastLayer();
        const overlap = this.currentLayer.calculateOverlap(previousLayer);
        
        // Game over if there's no overlap
        if (overlap.overlapWidth <= 0 || overlap.overlapDepth <= 0) {
            // For game over, we want to make the entire current layer fall
            // But we need to break it into smaller pieces for a more realistic effect
            const piecesCount = Math.max(2, Math.floor(Math.max(this.currentLayer.width, this.currentLayer.depth)));
            const smallPieces = [];
            
            // Break the layer into a grid of smaller pieces
            const pieceWidth = this.currentLayer.width / piecesCount;
            const pieceDepth = this.currentLayer.depth / piecesCount;
            
            for (let x = 0; x < piecesCount; x++) {
                for (let z = 0; z < piecesCount; z++) {
                    // Calculate the center position of this small piece
                    const centerX = this.currentLayer.mesh.position.x - (this.currentLayer.width / 2) + (pieceWidth / 2) + (x * pieceWidth);
                    const centerZ = this.currentLayer.mesh.position.z - (this.currentLayer.depth / 2) + (pieceDepth / 2) + (z * pieceDepth);
                    
                    smallPieces.push({
                        width: pieceWidth,
                        depth: pieceDepth,
                        centerX: centerX,
                        centerZ: centerZ
                    });
                }
            }
            
            return {
                success: false,
                perfectMatch: false,
                fallingPieces: this.currentLayer.createFallingPieces({
                    cutPieces: smallPieces,
                    overlapCenterX: previousLayer.mesh.position.x,
                    overlapCenterZ: previousLayer.mesh.position.z
                }, scene)
            };
        }
        
        // Remove the current layer mesh
        scene.remove(this.currentLayer.mesh);
        
        // Create a new layer based on the overlap
        const newLayer = this.currentLayer.createOverlapLayer(overlap);
        scene.add(newLayer.mesh);
        this.layers.push(newLayer);
        
        // Create falling pieces for the parts that don't overlap
        const fallingPieces = this.currentLayer.createFallingPieces(overlap, scene);
        
        // Create the next layer
        this.createNextLayer(scene);
        
        return {
            success: true,
            perfectMatch: overlap.perfectMatch,
            fallingPieces: fallingPieces
        };
    }
    
    // Update the tower
    update(delta) {
        if (this.currentLayer && this.currentLayer.moving) {
            this.currentLayer.update(delta);
        }
    }
    
    // Get the current height of the tower
    getHeight() {
        return this.layers.length * this.layerHeight;
    }
}
