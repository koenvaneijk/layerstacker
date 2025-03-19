/**
 * Renderer for the Layer Stacker game
 */
const GameRenderer = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    effectBloom: null,
    clock: new THREE.Clock(),
    animatedObjects: [],
    
    // Initialize the renderer
    init: function() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        // Skip post-processing to avoid dependency errors
        // this.createPostProcessing();
        this.createLights();
        this.createEnvironment();
        this.createSkybox();
        
        // Start animation loop for dynamic elements
        this.animate();
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    },
    
    // Create the Three.js scene
    createScene: function() {
        this.scene = new THREE.Scene();
        // Using fog for depth but with a greater distance for more visibility
        this.scene.fog = new THREE.FogExp2(new THREE.Color(0x090b1a).getHex(), 0.01);
    },
    
    // Create the camera
    createCamera: function() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.setCameraPosition(0);
    },
    
    // Set camera position based on tower height
    setCameraPosition: function(towerHeight) {
        // Base position
        const y = 10 + towerHeight * 0.8;
        this.camera.position.set(15, y, 15);
        this.camera.lookAt(0, towerHeight, 0);
    },
    
    // Animate camera to a new position
    animateCameraToPosition: function(towerHeight, duration = 1) {
        const y = 10 + towerHeight * 0.8;
        const targetPosition = new THREE.Vector3(15, y, 15);
        const targetLookAt = new THREE.Vector3(0, towerHeight, 0);
        
        gsap.to(this.camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: duration,
            ease: "power2.out"
        });
        
        // Animate lookAt by using a dummy object
        const lookAtDummy = { x: 0, y: this.camera.position.y - 10, z: 0 };
        gsap.to(lookAtDummy, {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
                this.camera.lookAt(lookAtDummy.x, lookAtDummy.y, lookAtDummy.z);
            }
        });
    },
    
    // Create the WebGL renderer
    createRenderer: function() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // THREE.sRGBEncoding was renamed to THREE.SRGBColorSpace in newer versions
        if (THREE.SRGBColorSpace) {
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else if (THREE.sRGBEncoding) {
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
        
        if (THREE.ACESFilmicToneMapping) {
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
        }
    },
    
    // Set up post-processing effects - disabled for now
    createPostProcessing: function() {
        // Skipping post-processing setup since the dependencies are missing
        // We'll just use the standard renderer
        this.composer = null;
        this.effectBloom = null;
    },
    
    // Create lights for the scene
    createLights: function() {
        // Ambient light with a slight blue tint for cooler atmosphere
        const ambientLight = new THREE.AmbientLight(0xb9c4ff, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffeecc, 1.2);
        directionalLight.position.set(15, 30, 15);
        directionalLight.castShadow = true;
        
        // Optimize shadow settings
        directionalLight.shadow.camera.left = -30;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.top = 30;
        directionalLight.shadow.camera.bottom = -30;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.bias = -0.0001;
        
        this.scene.add(directionalLight);
        
        // Add a blue rim light from the opposite side
        const rimLight = new THREE.DirectionalLight(0x5580ff, 0.8);
        rimLight.position.set(-15, 10, -15);
        this.scene.add(rimLight);
        
        // Add subtle pulsing point lights around the scene
        this.createPulsingLights();
    },
    
    // Create subtle pulsing lights
    createPulsingLights: function() {
        const colors = [0x5580ff, 0xff7755, 0x55ff88];
        
        for (let i = 0; i < 4; i++) {
            const intensity = 0.7 + Math.random() * 0.5;
            const distance = 25 + Math.random() * 10;
            const light = new THREE.PointLight(colors[i % colors.length], intensity, distance);
            
            // Position in a circle around the scene
            const angle = (i / 4) * Math.PI * 2;
            const radius = 20;
            light.position.set(
                Math.cos(angle) * radius, 
                2 + Math.random() * 8,
                Math.sin(angle) * radius
            );
            
            // Add random pulse animation
            light.userData.initialIntensity = light.intensity;
            light.userData.pulseSpeed = 0.5 + Math.random() * 0.5;
            light.userData.pulseAmount = 0.2 + Math.random() * 0.3;
            light.userData.timeOffset = Math.random() * Math.PI * 2;
            
            this.animatedObjects.push({
                object: light,
                update: (time) => {
                    const value = Math.sin(time * light.userData.pulseSpeed + light.userData.timeOffset);
                    light.intensity = light.userData.initialIntensity * (1 + value * light.userData.pulseAmount);
                }
            });
            
            this.scene.add(light);
        }
    },
    
    // Create environment elements
    createEnvironment: function() {
        // Create a procedural ground with shader material
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 64, 64);
        
        // Create shader material for ground
        const groundMaterial = Shaders.createShaderMaterial(
            Shaders.groundVertex,
            Shaders.groundFragment,
            {
                baseColor: { value: new THREE.Color(0x151825) },
                lineColor: { value: new THREE.Color(0x4a4ae9) }
            }
        );
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add glowing ring around the base
        const ringGeometry = new THREE.TorusGeometry(8, 0.05, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4a4ae9,
            transparent: true,
            opacity: 0.7
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = -0.45;
        ring.rotation.x = Math.PI / 2;
        ring.userData.isEnvironment = true; // Tag as environment object to preserve during cleanup
        this.scene.add(ring);
        
        // Animate the ring
        this.animatedObjects.push({
            object: ring,
            update: (time) => {
                ring.scale.set(1 + Math.sin(time * 0.5) * 0.05, 1 + Math.sin(time * 0.5) * 0.05, 1);
                ringMaterial.opacity = 0.5 + Math.sin(time * 0.5) * 0.2;
            }
        });
        
        // Add floating particles for atmosphere
        this.createFloatingParticles();
    },
    
    // Create a procedural skybox with custom shader
    createSkybox: function() {
        const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyMaterial = Shaders.createShaderMaterial(
            Shaders.skyboxVertex,
            Shaders.skyboxFragment,
            {
                topColor: { value: new THREE.Color(0x0a1029) },
                bottomColor: { value: new THREE.Color(0x1a2151) },
                sunColor: { value: new THREE.Color(0xffffee) },
                sunPosition: { value: new THREE.Vector3(100, 10, 100) },
                uTime: { value: 0.0 } // Add time uniform
            }
        );
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        sky.userData.isEnvironment = true; // Tag as environment object
        this.scene.add(sky);
        
        // Store reference to update the time uniform
        this.skyMaterial = skyMaterial;
    },
    
    // Create floating particles in the background
    createFloatingParticles: function() {
        const particleCount = 150;
        const particleGroup = new THREE.Group();
        particleGroup.userData.isEnvironment = true; // Tag the whole group as an environment object
        
        // Create particles with different colors and sizes
        for (let i = 0; i < particleCount; i++) {
            const size = 0.02 + Math.random() * 0.08;
            const geometry = new THREE.SphereGeometry(size, 8, 8);
            
            // Use different colors for variety
            const color = new THREE.Color();
            color.setHSL(Math.random(), 0.7, 0.5 + Math.random() * 0.3);
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.5
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Position randomly in a large sphere
            const radius = 15 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI - Math.PI/2;
            
            particle.position.x = radius * Math.cos(theta) * Math.cos(phi);
            particle.position.y = radius * Math.sin(phi) + 5;
            particle.position.z = radius * Math.sin(theta) * Math.cos(phi);
            
            // Add animation data
            particle.userData.initialPosition = particle.position.clone();
            particle.userData.speedX = (Math.random() - 0.5) * 0.05;
            particle.userData.speedY = (Math.random() - 0.5) * 0.03;
            particle.userData.speedZ = (Math.random() - 0.5) * 0.05;
            particle.userData.pulseSpeed = 0.2 + Math.random() * 0.5;
            
            this.animatedObjects.push({
                object: particle,
                update: (time) => {
                    // Gentle floating movement
                    particle.position.x = particle.userData.initialPosition.x + Math.sin(time * particle.userData.speedX) * 2;
                    particle.position.y = particle.userData.initialPosition.y + Math.sin(time * particle.userData.speedY) * 1;
                    particle.position.z = particle.userData.initialPosition.z + Math.sin(time * particle.userData.speedZ) * 2;
                    
                    // Pulse opacity
                    material.opacity = 0.5 + Math.sin(time * particle.userData.pulseSpeed) * 0.3;
                }
            });
            
            particleGroup.add(particle);
        }
        
        this.scene.add(particleGroup);
            
        // Store a reference to the particle group for reuse on restart
        this.particleGroup = particleGroup;
    },
    
    // Handle window resize
    onWindowResize: function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    
    // Animation loop for dynamic elements
    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = this.clock.getElapsedTime();
        
        // Update all animated objects
        for (const obj of this.animatedObjects) {
            // Tag the object as animated if it's not already
            if (obj.object && obj.object.userData) {
                obj.object.userData.isAnimated = true;
            }
            obj.update(time);
        }
    },
    
    // Create particle effect for perfect stack
    createPerfectStackEffect: function(position) {
        const particleCount = 50;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xffcc00 : 0xffffff,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position around the center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y,
                position.z + Math.sin(angle) * radius
            );
            
            // Random velocity
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 10 + 5,
                (Math.random() - 0.5) * 5
            );
            
            // Random lifetime
            particle.userData.lifetime = 0;
            particle.userData.maxLifetime = 1 + Math.random();
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animation loop for particles
        const animateParticles = () => {
            let allDead = true;
            
            particles.children.forEach(particle => {
                if (particle.userData.lifetime < particle.userData.maxLifetime) {
                    allDead = false;
                    
                    // Update position
                    particle.position.x += particle.userData.velocity.x * 0.016;
                    particle.position.y += particle.userData.velocity.y * 0.016;
                    particle.position.z += particle.userData.velocity.z * 0.016;
                    
                    // Apply gravity
                    particle.userData.velocity.y -= 15 * 0.016;
                    
                    // Update lifetime and opacity
                    particle.userData.lifetime += 0.016;
                    particle.material.opacity = 1 - (particle.userData.lifetime / particle.userData.maxLifetime);
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                // Clean up
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                // Remove particles using the older method
                if (particles.parent) {
                    particles.parent.remove(particles);
                }
            }
        };
        
        animateParticles();
    },
    
    // Create screen shake effect
    shakeCamera: function(intensity = 0.5, duration = 0.5) {
        const originalPosition = this.camera.position.clone();
        
        // Use GSAP for the shake effect
        const timeline = gsap.timeline();
        
        // Add random movements
        for (let i = 0; i < 5; i++) {
            timeline.to(this.camera.position, {
                x: originalPosition.x + (Math.random() - 0.5) * intensity,
                y: originalPosition.y + (Math.random() - 0.5) * intensity,
                z: originalPosition.z + (Math.random() - 0.5) * intensity,
                duration: duration / 5,
                ease: "power1.inOut"
            });
        }
        
        // Return to original position
        timeline.to(this.camera.position, {
            x: originalPosition.x,
            y: originalPosition.y,
            z: originalPosition.z,
            duration: duration / 5,
            ease: "power2.out"
        });
    },
    
    // Enhanced perfect stack effect
    createPerfectStackEffect: function(position) {
        const particleCount = 100;
        const particles = new THREE.Group();
        
        // Create a burst of particles
        for (let i = 0; i < particleCount; i++) {
            // Alternate between different particle shapes for variety
            let geometry;
            const shapeType = Math.floor(Math.random() * 3);
            
            if (shapeType === 0) {
                geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 8, 8);
            } else if (shapeType === 1) {
                geometry = new THREE.BoxGeometry(
                    0.08 + Math.random() * 0.1,
                    0.08 + Math.random() * 0.1,
                    0.08 + Math.random() * 0.1
                );
            } else {
                geometry = new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.1);
            }
            
            // Use bright, celebratory colors
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.9, 0.6),
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Position around the center with more upward trajectory
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1;
            const height = Math.random() * 1;
            
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + height,
                position.z + Math.sin(angle) * radius
            );
            
            // More dynamic velocity 
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 12 + 5,  // Stronger upward velocity
                (Math.random() - 0.5) * 8
            );
            
            // Add rotation
            particle.userData.rotationSpeed = new THREE.Vector3(
                Math.random() * 5,
                Math.random() * 5,
                Math.random() * 5
            );
            
            // Random lifetime
            particle.userData.lifetime = 0;
            particle.userData.maxLifetime = 1 + Math.random();
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // Animation loop for particles
        const animateParticles = (time) => {
            const delta = time || 0.016;
            let allDead = true;
            
            particles.children.forEach(particle => {
                if (particle.userData.lifetime < particle.userData.maxLifetime) {
                    allDead = false;
                    
                    // Update position
                    particle.position.x += particle.userData.velocity.x * delta;
                    particle.position.y += particle.userData.velocity.y * delta;
                    particle.position.z += particle.userData.velocity.z * delta;
                    
                    // Apply gravity
                    particle.userData.velocity.y -= 20 * delta;
                    
                    // Apply damping
                    particle.userData.velocity.x *= 0.99;
                    particle.userData.velocity.z *= 0.99;
                    
                    // Update rotation
                    particle.rotation.x += particle.userData.rotationSpeed.x * delta;
                    particle.rotation.y += particle.userData.rotationSpeed.y * delta;
                    particle.rotation.z += particle.userData.rotationSpeed.z * delta;
                    
                    // Update lifetime and opacity
                    particle.userData.lifetime += delta;
                    particle.material.opacity = 1 - (particle.userData.lifetime / particle.userData.maxLifetime);
                    
                    // Scale down toward end of life
                    const lifeRatio = particle.userData.lifetime / particle.userData.maxLifetime;
                    if (lifeRatio > 0.7) {
                        const scale = 1 - ((lifeRatio - 0.7) / 0.3);
                        particle.scale.set(scale, scale, scale);
                    }
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(() => {
                    animateParticles(0.016); // Fixed time step
                });
            } else {
                // Clean up
                particles.children.forEach(particle => {
                    particle.geometry.dispose();
                    particle.material.dispose();
                });
                particles.removeFromParent();
            }
        };
        
        animateParticles();
        
        // Add a burst of light
        const burstLight = new THREE.PointLight(0xffffaa, 2, 10);
        burstLight.position.copy(position);
        this.scene.add(burstLight);
        
        // Animate the light
        gsap.to(burstLight, {
            intensity: 0,
            duration: 0.5,
            onComplete: () => {
                // Remove light using the older method
                if (burstLight.parent) {
                    burstLight.parent.remove(burstLight);
                }
            }
        });
    },
    
    // Enhanced screen shake effect
    shakeCamera: function(intensity = 0.5, duration = 0.5) {
        const originalPosition = this.camera.position.clone();
        const originalTarget = this.camera.target || new THREE.Vector3(0, 0, 0);
        
        // Use GSAP for the shake effect
        const timeline = gsap.timeline();
        
        // More dynamic shaking pattern
        for (let i = 0; i < 10; i++) {
            const shakeFactor = intensity * Math.pow(0.9, i);  // Decreasing intensity
            
            timeline.to(this.camera.position, {
                x: originalPosition.x + (Math.random() - 0.5) * shakeFactor * 2,
                y: originalPosition.y + (Math.random() - 0.5) * shakeFactor,
                z: originalPosition.z + (Math.random() - 0.5) * shakeFactor * 2,
                duration: duration / 15,
                ease: "power1.inOut"
            });
        }
        
        // Return to original position
        timeline.to(this.camera.position, {
            x: originalPosition.x,
            y: originalPosition.y,
            z: originalPosition.z,
            duration: duration / 5,
            ease: "power2.out"
        });
    },
    
    // Render the scene
    render: function() {
        // Update time uniform for skybox if it exists
        if (this.skyMaterial && this.skyMaterial.uniforms && this.skyMaterial.uniforms.uTime) {
            this.skyMaterial.uniforms.uTime.value = this.clock.getElapsedTime();
        }
        
        // Always use the standard renderer since composer is disabled
        this.renderer.render(this.scene, this.camera);
    }
};
