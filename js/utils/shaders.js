/**
 * Shader utilities for advanced visuals
 */
const Shaders = {
    // Vertex shader for skybox
    skyboxVertex: `
        varying vec3 vWorldPosition;
        
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    // Fragment shader for procedural skybox
    skyboxFragment: `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunPosition;
        uniform float uTime;
        
        // Improved noise function for stars
        float hash(float n) {
            return fract(sin(n) * 43758.5453);
        }
        
        float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            
            float n = p.x + p.y * 157.0 + 113.0 * p.z;
            return mix(
                mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                    mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                    mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
        }
        
        void main() {
            vec3 viewDirection = normalize(vWorldPosition);
            float h = normalize(viewDirection).y * 0.5 + 0.5;
            vec3 skyColor = mix(bottomColor, topColor, h);
            
            // Add sun
            float sunEffect = max(0.0, dot(viewDirection, normalize(sunPosition)));
            sunEffect = pow(sunEffect, 256.0);
            
            // Animated stars with time-based twinkling
            float starsEffect = 0.0;
            if (viewDirection.y > 0.1) {
                // Add time to create twinkling effect
                vec3 starPos = viewDirection * 100.0;
                float starNoise = noise(starPos + vec3(0.0, 0.0, uTime * 0.1));
                float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + starNoise * 10.0);
                starsEffect = (starNoise > 0.97) ? 0.5 * pow(starNoise, 8.0) * twinkle : 0.0;
            }
            
            // Animated clouds with time-based movement
            float cloudEffect = 0.0;
            if (viewDirection.y > 0.0 && viewDirection.y < 0.7) {
                // Move clouds slowly over time
                vec3 cloudPos = viewDirection * 10.0 + vec3(uTime * 0.05, 0.0, uTime * 0.03);
                float cloudNoise = noise(cloudPos * vec3(5.0, 10.0, 5.0));
                cloudEffect = cloudNoise * 0.1 * (1.0 - viewDirection.y);
            }
            
            vec3 finalColor = skyColor + vec3(1.0, 0.9, 0.7) * sunEffect + vec3(1.0) * starsEffect + vec3(1.0) * cloudEffect;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    
    // Vertex shader for ground
    groundVertex: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    // Fragment shader for procedural ground
    groundFragment: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        uniform vec3 baseColor;
        uniform vec3 lineColor;
        
        float grid(vec2 p, float res) {
            vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) * res;
            float line = min(grid.x, grid.y);
            return 1.0 - min(line, 1.0);
        }
        
        void main() {
            // Base grid
            float mainGrid = grid(vWorldPosition.xz * 0.25, 0.5);
            
            // Secondary finer grid
            float secondaryGrid = grid(vWorldPosition.xz * 1.0, 0.05);
            
            // Create a radial gradient from the center
            float dist = length(vWorldPosition.xz) * 0.05;
            float radialGradient = 1.0 - min(dist, 1.0);
            
            // Combine the effects
            vec3 color = mix(baseColor, lineColor, mainGrid * 0.5 + secondaryGrid * 0.2);
            
            // Add distant fog effect
            color = mix(vec3(0.05, 0.06, 0.1), color, radialGradient);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    
    // Vertex shader for bloom effect (applied to specific materials)
    bloomVertex: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
    // Fragment shader for bloom effect
    bloomFragment: `
        uniform sampler2D baseTexture;
        uniform float bloomStrength;
        uniform float bloomRadius;
        uniform vec3 bloomColor;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(baseTexture, vUv);
            vec3 bloom = bloomColor * bloomStrength;
            color.rgb += bloom;
            gl_FragColor = color;
        }
    `,
    
    // Create a THREE shader material from vertex and fragment shaders
    createShaderMaterial: function(vertexShader, fragmentShader, uniforms) {
        return new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide
        });
    }
};
