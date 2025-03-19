/**
 * Layer class for the Layer Stacker game
 */
class Layer {
    constructor(width, depth, height, position, color) {
        this.width = width;
        this.depth = depth;
        this.height = height;
        this.position = position.clone();
        this.color = color;
        this.mesh = null;
        this.direction = 1; // 1 for right, -1 for left
        this.speed = 0;
        this.moving = false;
        
        this.createMesh();
    }
    
    createMesh() {
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.color,
            flatShading: true
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Add a subtle shadow effect with a slightly darker bottom face
        const darkerMaterial = new THREE.MeshLambertMaterial({ 
            color: Colors.getDarkerColor(this.color, 0.7),
            flatShading: true
        });
        
        this.mesh.material = [
            material,           // right side
            material,           // left side
            material,           // top side
            darkerMaterial,     // bottom side
            material,           // front side
            material            // back side
        ];
        
        // Create a subtle bevel effect
        this.mesh.geometry.translate(0, this.height / 2, 0);
    }
    
    // Start the layer moving
    startMoving(speed, direction) {
        this.speed = speed;
        this.direction = direction;
        this.moving = true;
    }
    
    // Stop the layer
    stopMoving() {
        this.moving = false;
        this.position.copy(this.mesh.position);
    }
    
    // Update layer position during movement
    update(delta) {
        if (this.moving) {
            this.mesh.position.x += this.speed * this.direction * delta;
            
            // Boundary check to reverse direction if needed
            if (this.mesh.position.x > 10) {
                this.mesh.position.x = 10;
                this.direction = -1;
            } else if (this.mesh.position.x < -10) {
                this.mesh.position.x = -10;
                this.direction = 1;
            }
        }
    }
    
    // Calculate overlap with previous layer and return the non-overlapping parts
    calculateOverlap(previousLayer) {
        // No previous layer, perfect placement
        if (!previousLayer) {
            return {
                perfectMatch: true,
                overlapWidth: this.width,
                overlapDepth: this.depth,
                overlapCenterX: this.mesh.position.x,
                overlapCenterZ: this.mesh.position.z,
                cutPieces: []
            };
        }
        
        const thisX = this.mesh.position.x;
        const thisZ = this.mesh.position.z;
        const prevX = previousLayer.mesh.position.x;
        const prevZ = previousLayer.mesh.position.z;
        
        // Calculate overlap in X direction
        const thisLeft = thisX - this.width / 2;
        const thisRight = thisX + this.width / 2;
        const prevLeft = prevX - previousLayer.width / 2;
        const prevRight = prevX + previousLayer.width / 2;
        
        const overlapLeft = Math.max(thisLeft, prevLeft);
        const overlapRight = Math.min(thisRight, prevRight);
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        
        // Calculate overlap in Z direction
        const thisFront = thisZ - this.depth / 2;
        const thisBack = thisZ + this.depth / 2;
        const prevFront = prevZ - previousLayer.depth / 2;
        const prevBack = prevZ + previousLayer.depth / 2;
        
        const overlapFront = Math.max(thisFront, prevFront);
        const overlapBack = Math.min(thisBack, prevBack);
        const overlapDepth = Math.max(0, overlapBack - overlapFront);
        
        // Calculate center of overlap - ensure it's precise
        const overlapCenterX = parseFloat(((overlapLeft + overlapRight) / 2).toFixed(4));
        const overlapCenterZ = parseFloat(((overlapFront + overlapBack) / 2).toFixed(4));
        
        // Check if there's no overlap
        if (overlapWidth <= 0 || overlapDepth <= 0) {
            return {
                perfectMatch: false,
                overlapWidth: 0,
                overlapDepth: 0,
                overlapCenterX: thisX,
                overlapCenterZ: thisZ,
                cutPieces: [
                    {
                        width: this.width,
                        depth: this.depth,
                        centerX: thisX,
                        centerZ: thisZ
                    }
                ]
            };
        }
        
        // Check if it's a perfect match
        const perfectMatch = 
            Math.abs(overlapWidth - previousLayer.width) < 0.001 && 
            Math.abs(overlapDepth - previousLayer.depth) < 0.001;
        
        // Calculate cut pieces (parts that don't overlap)
        const cutPieces = [];
        
        // Left piece
        if (thisLeft < overlapLeft) {
            const leftWidth = overlapLeft - thisLeft;
            cutPieces.push({
                width: leftWidth,
                depth: this.depth,
                centerX: thisLeft + leftWidth / 2,
                centerZ: thisZ
            });
        }
        
        // Right piece
        if (thisRight > overlapRight) {
            const rightWidth = thisRight - overlapRight;
            cutPieces.push({
                width: rightWidth,
                depth: this.depth,
                centerX: overlapRight + rightWidth / 2,
                centerZ: thisZ
            });
        }
        
        // Front piece (excluding corners already counted)
        if (thisFront < overlapFront) {
            const frontDepth = overlapFront - thisFront;
            const frontWidth = Math.min(overlapWidth, this.width);
            cutPieces.push({
                width: frontWidth,
                depth: frontDepth,
                centerX: overlapCenterX,
                centerZ: thisFront + frontDepth / 2
            });
        }
        
        // Back piece (excluding corners already counted)
        if (thisBack > overlapBack) {
            const backDepth = thisBack - overlapBack;
            const backWidth = Math.min(overlapWidth, this.width);
            cutPieces.push({
                width: backWidth,
                depth: backDepth,
                centerX: overlapCenterX,
                centerZ: overlapBack + backDepth / 2
            });
        }
        
        return {
            perfectMatch,
            overlapWidth,
            overlapDepth,
            overlapCenterX,
            overlapCenterZ,
            cutPieces
        };
    }
    
    // Create a new layer based on the overlap with the previous layer
    createOverlapLayer(overlap) {
        // Create a new layer with the overlap dimensions
        const newLayer = new Layer(
            overlap.overlapWidth,
            overlap.overlapDepth,
            this.height,
            new THREE.Vector3(overlap.overlapCenterX, this.position.y, overlap.overlapCenterZ),
            this.color
        );
        
        // Ensure the mesh is positioned correctly
        newLayer.mesh.position.set(overlap.overlapCenterX, this.position.y, overlap.overlapCenterZ);
        
        return newLayer;
    }
    
    // Create falling pieces for the parts that don't overlap
    createFallingPieces(overlap, scene) {
        const fallingPieces = [];
        
        // Create a center point for the overlap to use as reference for physics
        // Use the exact position values from the overlap calculation
        const overlapCenter = new THREE.Vector3(
            overlap.overlapCenterX !== undefined ? overlap.overlapCenterX : this.mesh.position.x,
            this.position.y,
            overlap.overlapCenterZ !== undefined ? overlap.overlapCenterZ : this.mesh.position.z
        );
        
        // Add a small delay between each piece to prevent them from all falling at once
        let delay = 0;
        
        for (const piece of overlap.cutPieces) {
            // Create a clone of the material to allow for individual opacity changes
            const material = this.mesh.material[0].clone();
            
            // Create geometry with a small inset to prevent z-fighting
            const geometry = new THREE.BoxGeometry(
                Math.max(0.1, piece.width - 0.02), 
                this.height, 
                Math.max(0.1, piece.depth - 0.02)
            );
            
            const position = new THREE.Vector3(
                piece.centerX,
                this.position.y,
                piece.centerZ
            );
            
            // Direction is based on which side the piece is falling from
            const direction = piece.centerX > overlap.overlapCenterX ? 1 : -1;
            
            // Create the falling piece with a reference to the overlap center
            const fallingPiece = Physics.createFallingPiece(
                geometry, 
                material, 
                position, 
                direction,
                overlapCenter
            );
            
            // Add a small random delay to each piece for a more natural effect
            setTimeout(() => {
                scene.add(fallingPiece);
            }, delay);
            
            delay += Math.random() * 30; // 0-30ms delay between pieces
            fallingPieces.push(fallingPiece);
        }
        
        return fallingPieces;
    }
}
