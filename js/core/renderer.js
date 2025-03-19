/**
 * Renderer for the Layer Stacker game
 */
const GameRenderer = {
    scene: null,
    camera: null,
    renderer: null,
    
    // Initialize the renderer
    init: function() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createLights();
        this.createEnvironment();
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    },
    
    // Create the Three.js scene
    createScene: function() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(Colors.backgroundTop);
        this.scene.fog = new THREE.Fog(Colors.backgroundTop, 20, 100);
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
            alpha: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    },
    
    // Create lights for the scene
    createLights: function() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Optimize shadow settings
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        
        this.scene.add(directionalLight);
    },
    
    // Create environment elements
    createEnvironment: function() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3d3d3d,
            side: THREE.DoubleSide
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Grid helper
        const grid = new THREE.GridHelper(100, 100, 0x000000, 0x111111);
        grid.position.y = -0.48;
        this.scene.add(grid);
    },
    
    // Handle window resize
    onWindowResize: function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
                particles.removeFromParent();
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
    
    // Render the scene
    render: function() {
        this.renderer.render(this.scene, this.camera);
    }
};
