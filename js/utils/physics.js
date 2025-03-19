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
    
    // Create a falling piece from a geometry with enhanced visual effects
    createFallingPiece: function(geometry, material, position, direction, overlapCenter) {
        let piece;
        
        // Try to reuse an existing piece from the pool
        if (this.fallingPieces.length > 0) {
            piece = this.fallingPieces.pop();
            
            // Clean up old geometry
            if (piece.geometry) {
                piece.geometry.dispose();
            }
            
            // If piece is a group, clean up children first
            if (piece.isGroup) {
                while (piece.children.length > 0) {
                    const child = piece.children[0];
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                    piece.remove(child);
                }
                
                // Create new mesh as child
                const newMesh = new THREE.Mesh(geometry, material);
                piece.add(newMesh);
            } else {
                // Replace geometry and material
                piece.geometry = geometry;
                piece.material = material;
            }
        } else {
            // Create a new group to hold the piece and effects
            piece = new THREE.Group();
            
            // Main mesh
            const mainMesh = new THREE.Mesh(geometry, material);
            piece.add(mainMesh);
            
            // Optional: Add trail effect for more visual interest
            if (Math.random() > 0.5) {
                const trailGeometry = new THREE.PlaneGeometry(0.2, 0.8);
                const trailMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                
                const trail = new THREE.Mesh(trailGeometry, trailMaterial);
                trail.position.set(0, -0.4, 0);
                trail.rotation.x = Math.PI / 2;
                piece.add(trail);
                
                // Store for animation
                piece.userData.trail = trail;
            }
            
            piece.isGroup = true; // Mark as a group for future reference
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
        
        // More dynamic initial velocities for better visual interest
        piece.userData.velocity = new THREE.Vector3(
            directionVector.x * (3 + Math.random() * 3),
            1.0 + Math.random() * 2.5, // Higher upward initial velocity for better arc
            directionVector.z * (3 + Math.random() * 3)
        );
        
        // More dramatic rotation velocities
        piece.userData.rotationVelocity = new THREE.Vector3(
            directionVector.z * (0.1 + Math.random() * 0.15),
            Math.random() * 0.1,
            -directionVector.x * (0.1 + Math.random() * 0.15)
        );
        
        // Add some random spin to make it more chaotic
        if (Math.random() > 0.5) {
            piece.userData.rotationVelocity.y = 0.2 + Math.random() * 0.3;
        }
        
        piece.userData.lifetime = 0;
        piece.userData.maxLifetime = 3 + Math.random() * 2; // 3-5 seconds lifetime
        piece.userData.initialColor = material.color ? material.color.clone() : null;
        
        // Add a small random offset to prevent pieces from starting at exactly the same position
        piece.position.x += (Math.random() - 0.5) * 0.05;
        piece.position.z += (Math.random() - 0.5) * 0.05;
        
        // Enable shadows
        piece.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        this.activePieces.push(piece);
        return piece;
    },
    
    // Update all falling pieces with enhanced effects
    update: function(delta) {
        for (let i = this.activePieces.length - 1; i >= 0; i--) {
            const piece = this.activePieces[i];
            
            // Skip if piece is invalid
            if (!piece || !piece.userData) {
                this.activePieces.splice(i, 1);
                continue;
            }
            
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
            if (piece.rotation) {
                piece.rotation.x += piece.userData.rotationVelocity.x * delta * 60; // Normalize to 60fps
                piece.rotation.y += piece.userData.rotationVelocity.y * delta * 60;
                piece.rotation.z += piece.userData.rotationVelocity.z * delta * 60;
            }
            
            // Add slight oscillation to rotation for more dynamic effect
            if (piece.rotation) {
                const oscillation = Math.sin(piece.userData.lifetime * 5) * 0.02;
                piece.rotation.x += oscillation;
                piece.rotation.z += oscillation;
            }
            
            // Gradually slow down rotation
            if (piece.userData.rotationVelocity) {
                piece.userData.rotationVelocity.x *= 0.99;
                piece.userData.rotationVelocity.y *= 0.99;
                piece.userData.rotationVelocity.z *= 0.99;
            }
            
            // Update lifetime
            piece.userData.lifetime += delta;
            
            // Update trail effect if present
            if (piece.userData.trail) {
                // Make trail follow the velocity direction
                const trail = piece.userData.trail;
                trail.lookAt(
                    piece.position.x - piece.userData.velocity.x,
                    piece.position.y - piece.userData.velocity.y,
                    piece.position.z - piece.userData.velocity.z
                );
                
                // Scale the trail based on velocity
                const speed = piece.userData.velocity.length();
                const trailScale = Math.min(1.5, speed * 0.1);
                trail.scale.y = trailScale;
                
                // Fade out trail over time
                if (piece.userData.lifetime > piece.userData.maxLifetime * 0.5) {
                    trail.material.opacity = 0.3 * (1 - (piece.userData.lifetime - (piece.userData.maxLifetime * 0.5)) / (piece.userData.maxLifetime * 0.5));
                }
            }
            
            // Color transition as pieces fall - shift towards blue/darker
            if (piece.userData.initialColor) {
                // For each child that's a mesh
                piece.traverse(child => {
                    if (child.isMesh && child.material && child.material.color) {
                        const progress = piece.userData.lifetime / piece.userData.maxLifetime;
                        const initialColor = piece.userData.initialColor;
                        
                        // Transition to blue color as piece falls
                        child.material.color.r = initialColor.r - initialColor.r * progress * 0.7;
                        child.material.color.g = initialColor.g - initialColor.g * progress * 0.5;
                        child.material.color.b = Math.min(1, initialColor.b + (1 - initialColor.b) * progress * 0.5);
                    }
                });
            }
            
            // Fade out pieces as they approach their max lifetime
            if (piece.userData.lifetime > piece.userData.maxLifetime * 0.7) {
                const opacity = 1 - ((piece.userData.lifetime - (piece.userData.maxLifetime * 0.7)) / (piece.userData.maxLifetime * 0.3));
                
                // Apply opacity to all submeshes
                piece.traverse(child => {
                    if (child.isMesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => {
                                m.opacity = Math.max(0, opacity);
                                m.transparent = true;
                            });
                        } else {
                            child.material.opacity = Math.max(0, opacity);
                            child.material.transparent = true;
                        }
                    }
                });
            }
            
            // Occasional particle emission for falling pieces
            if (Math.random() < delta * 2 && piece.userData.lifetime < piece.userData.maxLifetime * 0.7) {
                this.emitParticleFromPiece(piece);
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
    
    // Emit a small dust particle from a falling piece
    emitParticleFromPiece: function(piece) {
        // Safety check - ensure the piece has valid data
        if (!piece || !piece.position || !piece.userData || !piece.userData.velocity) {
            return;
        }
        
        // Create a small particle geometry
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x80a0ff,
            transparent: true,
            opacity: 0.7
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Position at the piece
        particle.position.copy(piece.position);
        
        // Add small random offset
        particle.position.x += (Math.random() - 0.5) * 0.2;
        particle.position.y += (Math.random() - 0.5) * 0.2;
        particle.position.z += (Math.random() - 0.5) * 0.2;
        
        // Give it a slower velocity than the piece
        particle.userData.velocity = new THREE.Vector3(
            piece.userData.velocity.x * 0.1,
            piece.userData.velocity.y * 0.1,
            piece.userData.velocity.z * 0.1
        );
        
        // Short lifetime
        particle.userData.lifetime = 0;
        particle.userData.maxLifetime = 0.5 + Math.random() * 0.5;
        
        // Initialize rotation velocity for the particle
        particle.userData.rotationVelocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        // Add to the active pieces array
        this.activePieces.push(particle);
        
        // Add to the scene - THREE.SceneUtils.attach is deprecated
        if (piece.parent) {
            piece.parent.add(particle);
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
