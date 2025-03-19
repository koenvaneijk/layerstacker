/**
 * Physics utilities for the Layer Stacker game
 */
const Physics = {
    gravity: 9.8, // Gravity constant
    
    // Object pool for falling pieces to reduce garbage collection
    fallingPieces: [],
    activePieces: [],
    
    // Initialize physics system
    init: function() {
        this.fallingPieces = [];
        this.activePieces = [];
    },
    
    // Create a falling piece from a geometry
    createFallingPiece: function(geometry, material, position, direction) {
        let piece;
        
        // Try to reuse an existing piece from the pool
        if (this.fallingPieces.length > 0) {
            piece = this.fallingPieces.pop();
            piece.geometry.dispose();
            piece.geometry = geometry;
            piece.material = material;
        } else {
            // Create a new piece if none are available in the pool
            piece = new THREE.Mesh(geometry, material);
        }
        
        // Set initial position and physics properties
        piece.position.copy(position);
        piece.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2 * direction,
            0,
            (Math.random() - 0.5) * 2
        );
        piece.userData.rotationVelocity = new THREE.Vector3(
            Math.random() * 0.1,
            Math.random() * 0.1,
            Math.random() * 0.1
        );
        piece.userData.lifetime = 0;
        piece.userData.maxLifetime = 3 + Math.random() * 2; // 3-5 seconds lifetime
        
        this.activePieces.push(piece);
        return piece;
    },
    
    // Update all falling pieces
    update: function(delta) {
        for (let i = this.activePieces.length - 1; i >= 0; i--) {
            const piece = this.activePieces[i];
            
            // Apply gravity
            piece.userData.velocity.y -= this.gravity * delta;
            
            // Update position
            piece.position.x += piece.userData.velocity.x * delta;
            piece.position.y += piece.userData.velocity.y * delta;
            piece.position.z += piece.userData.velocity.z * delta;
            
            // Update rotation
            piece.rotation.x += piece.userData.rotationVelocity.x;
            piece.rotation.y += piece.userData.rotationVelocity.y;
            piece.rotation.z += piece.userData.rotationVelocity.z;
            
            // Update lifetime
            piece.userData.lifetime += delta;
            
            // Remove pieces that have fallen too far or lived too long
            if (piece.position.y < -50 || piece.userData.lifetime > piece.userData.maxLifetime) {
                // Return to object pool
                this.activePieces.splice(i, 1);
                this.fallingPieces.push(piece);
                piece.removeFromParent();
            }
        }
    },
    
    // Clean up all pieces
    reset: function() {
        // Move all active pieces back to the pool
        while (this.activePieces.length > 0) {
            const piece = this.activePieces.pop();
            piece.removeFromParent();
            this.fallingPieces.push(piece);
        }
    }
};
