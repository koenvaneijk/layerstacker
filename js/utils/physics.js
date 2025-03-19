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
    createFallingPiece: function(geometry, material, position, direction, overlapCenter) {
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
        
        // Calculate direction vector away from the center of the tower
        const directionVector = new THREE.Vector3(
            position.x - overlapCenter.x,
            0,
            position.z - overlapCenter.z
        );
        
        // Normalize and scale the direction vector
        if (directionVector.length() < 0.001) {
            // If the piece is directly above the center, give it a random direction
            directionVector.x = (Math.random() - 0.5) * 2;
            directionVector.z = (Math.random() - 0.5) * 2;
        }
        directionVector.normalize();
        
        // Initial velocity: horizontal component away from center + small random variation
        piece.userData.velocity = new THREE.Vector3(
            directionVector.x * (2 + Math.random() * 2),
            0.5 + Math.random() * 1.5, // Small upward initial velocity for better visual effect
            directionVector.z * (2 + Math.random() * 2)
        );
        
        // Rotation velocity based on the direction of fall
        piece.userData.rotationVelocity = new THREE.Vector3(
            directionVector.z * (0.05 + Math.random() * 0.05),
            Math.random() * 0.03,
            -directionVector.x * (0.05 + Math.random() * 0.05)
        );
        
        piece.userData.lifetime = 0;
        piece.userData.maxLifetime = 3 + Math.random() * 2; // 3-5 seconds lifetime
        
        // Add a small random offset to prevent pieces from starting at exactly the same position
        piece.position.x += (Math.random() - 0.5) * 0.05;
        piece.position.z += (Math.random() - 0.5) * 0.05;
        
        this.activePieces.push(piece);
        return piece;
    },
    
    // Update all falling pieces
    update: function(delta) {
        for (let i = this.activePieces.length - 1; i >= 0; i--) {
            const piece = this.activePieces[i];
            
            // Apply gravity with a more realistic acceleration
            piece.userData.velocity.y -= this.gravity * delta;
            
            // Apply air resistance (drag) to slow down pieces over time
            const drag = 0.98;
            piece.userData.velocity.x *= drag;
            piece.userData.velocity.z *= drag;
            
            // Update position
            piece.position.x += piece.userData.velocity.x * delta;
            piece.position.y += piece.userData.velocity.y * delta;
            piece.position.z += piece.userData.velocity.z * delta;
            
            // Update rotation - scale by delta for consistent rotation speed
            piece.rotation.x += piece.userData.rotationVelocity.x * delta * 60; // Normalize to 60fps
            piece.rotation.y += piece.userData.rotationVelocity.y * delta * 60;
            piece.rotation.z += piece.userData.rotationVelocity.z * delta * 60;
            
            // Gradually slow down rotation
            piece.userData.rotationVelocity.x *= 0.99;
            piece.userData.rotationVelocity.y *= 0.99;
            piece.userData.rotationVelocity.z *= 0.99;
            
            // Update lifetime
            piece.userData.lifetime += delta;
            
            // Fade out pieces as they approach their max lifetime
            if (piece.userData.lifetime > piece.userData.maxLifetime * 0.7) {
                const opacity = 1 - ((piece.userData.lifetime - (piece.userData.maxLifetime * 0.7)) / (piece.userData.maxLifetime * 0.3));
                if (piece.material.opacity !== undefined) {
                    piece.material.opacity = Math.max(0, opacity);
                    piece.material.transparent = true;
                }
            }
            
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
