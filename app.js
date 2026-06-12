import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* ==========================================================================
   CANVAS IMAGE SEQUENCE ENGINE & SCROLL REVEAL (3-PART SCROLL SECTION 1)
   ========================================================================== */
const scrollContainer = document.getElementById('scroll-main');
const section1 = document.getElementById('seccion-1');
const frameCanvas = document.getElementById('frame-canvas');
const fCtx = frameCanvas ? frameCanvas.getContext('2d') : null;
const revealTitle = document.getElementById('reveal-title');
const revealSubtitle = document.getElementById('reveal-subtitle');

// IMAGE SEQUENCE CONFIGURATION
const totalFrames = 143; // 143 frames total (frame_000 to frame_142)
const frames = [];
let loadedCount = 0;
let isLoaded = false;

let targetFrameIndex = 0;
let currentFrameIndex = 0;
let scrollProgress = 0;
let hasAutoScrolledToSec2 = false;

// Initialize empty frames array
for (let i = 0; i < totalFrames; i++) {
    frames.push(null);
}

// Preload frames in a controlled queue to prevent network saturation on PC
function preloadFrames() {
    if (!frameCanvas) return;
    
    // 1. Load the first frame immediately so the page displays instantly
    const firstImg = new Image();
    firstImg.src = `/frames/frame_000.webp`;
    
    const handleFirstLoad = () => {
        frames[0] = firstImg;
        loadedCount++;
        isLoaded = true; // Mark as loaded for the scrubbing loop to draw
        drawFrame(0);
        
        // 2. Start preloading the remaining frames with controlled concurrency (max 3)
        let nextToLoad = 1;
        const maxConcurrency = 3;
        
        function loadNext() {
            if (nextToLoad >= totalFrames) return;
            
            const current = nextToLoad++;
            const img = new Image();
            const frameNum = String(current).padStart(3, '0');
            img.src = `/frames/frame_${frameNum}.webp`;
            
            const handleLoad = () => {
                frames[current] = img;
                loadedCount++;
                if (loadedCount === totalFrames) {
                    // All frames loaded
                }
                loadNext(); // Load the next one in queue
            };
            
            img.onload = handleLoad;
            img.onerror = handleLoad;
        }
        
        // Launch parallel download threads
        for (let c = 0; c < maxConcurrency; c++) {
            loadNext();
        }
    };
    
    firstImg.onload = handleFirstLoad;
    firstImg.onerror = handleFirstLoad;
}
preloadFrames();

// Draw frame on canvas simulating CSS "object-fit: cover"
function drawFrame(frameIndex) {
    if (!fCtx || !frameCanvas || !frames[frameIndex] || !frames[frameIndex].complete) return;
    
    fCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    const img = frames[frameIndex];
    
    const canvasWidth = frameCanvas.width;
    const canvasHeight = frameCanvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = imgWidth / imgHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (canvasRatio > imgRatio) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
    } else {
        drawWidth = canvasHeight * imgRatio;
        drawHeight = canvasHeight;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
    }
    
    fCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Handle Canvas Resize
function resizeFrameCanvas() {
    if (frameCanvas && section1) {
        frameCanvas.width = window.innerWidth;
        frameCanvas.height = window.innerHeight;
        // Re-draw current frame on resize to keep correct proportions
        if (isLoaded) {
            drawFrame(Math.round(currentFrameIndex));
        }
    }
}
window.addEventListener('resize', resizeFrameCanvas);
resizeFrameCanvas();

// Helper to map values from one range to another
function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * (Math.max(inMin, Math.min(inMax, value)) - inMin) / (inMax - inMin);
}

// Fade/Translate helper for transition during Part 3
function setStickyOpacity(opacity, translateY) {
    const frameCanvasEl = document.getElementById('frame-canvas');
    const titleEl = document.getElementById('reveal-title');
    const subtitleEl = document.getElementById('reveal-subtitle');
    const indicatorEl = document.querySelector('.scroll-indicator');
    const smokeEl = document.getElementById('smoke-canvas');
    
    // Background canvas opacity (max 0.45)
    if (frameCanvasEl) frameCanvasEl.style.opacity = opacity * 0.45;
    
    // Smoke canvas opacity
    if (smokeEl) smokeEl.style.opacity = opacity;
    
    // Titles and subtitle slide up
    if (titleEl) {
        titleEl.style.opacity = opacity;
        // Preserve the scale from Part 2 while translating Y
        const currentScale = titleEl.style.transform.includes('scale') ? 
                             titleEl.style.transform.match(/scale\(([^)]+)\)/)[1] : 1.0;
        titleEl.style.transform = `translateY(${translateY}px) scale(${currentScale})`;
    }
    if (subtitleEl) {
        subtitleEl.style.opacity = opacity * 0.7;
        subtitleEl.style.transform = `translateY(${translateY}px)`;
    }
    
    // Scroll indicator opacity
    if (indicatorEl) {
        indicatorEl.style.opacity = opacity * 0.45;
        indicatorEl.style.transform = `translateX(-50%) translateY(${translateY * 0.5}px)`;
    }
}

// Main scroll handling logic
function handleScroll() {
    if (!scrollContainer || !section1) return;
    
    const scrollTop = scrollContainer.scrollTop;
    const viewportHeight = window.innerHeight;
    
    // Reset the auto-scroll flag if they scroll back up towards the top
    if (scrollTop < viewportHeight * 0.5) {
        hasAutoScrolledToSec2 = false;
    }
    
    // Fase 1: Canvas Image Scrubbing (scroll from 0 to 500vh, which is 5 * viewportHeight)
    const scrubRange = viewportHeight * 5;
    
    if (scrollTop <= scrubRange) {
        // progress runs from 0.0 to 1.0 over the 500vh scroll distance
        const p1 = Math.max(0, Math.min(1, scrollTop / scrubRange));
        targetFrameIndex = Math.floor(p1 * (totalFrames - 1));
        
        if (revealTitle) {
            const glowFactor = p1;
            revealTitle.style.textShadow = `0 0 ${20 + glowFactor * 35}px rgba(192, 38, 211, ${0.3 + glowFactor * 0.45})`;
            revealTitle.style.transform = `scale(${1 + glowFactor * 0.04})`;
            revealTitle.style.color = `rgba(255, 255, 255, ${0.7 + glowFactor * 0.3})`;
        }
        
        // Keep elements fully visible at their original position
        setStickyOpacity(1.0, 0);
    }
    
    // Fase 2: Transition out (scroll from 500vh to 600vh, which is from 5 * viewportHeight to 6 * viewportHeight)
    else {
        const exitStart = scrubRange;
        const exitRange = viewportHeight;
        
        // p2 runs from 0.0 to 1.0 over the 100vh scroll distance between Section 1 end and Section 2
        const p2 = Math.max(0, Math.min(1, (scrollTop - exitStart) / exitRange));
        targetFrameIndex = totalFrames - 1; // Lock at last frame
        
        if (revealTitle) {
            revealTitle.style.textShadow = `0 0 55px rgba(192, 38, 211, 0.75), 0 0 20px rgba(192, 38, 211, 0.35)`;
            revealTitle.style.color = 'rgba(255, 255, 255, 1.0)';
        }
        
        // Fade out and translate sticky elements upward for a parallax dissolve effect
        const fadeOpacity = 1 - p2;
        const fadeTranslateY = -p2 * 60; // 60px upward slide
        
        setStickyOpacity(fadeOpacity, fadeTranslateY);
    }
}

// Set up scroll event listeners
if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll);
}

// Run once on load to initialize elements at their starting scroll state
window.addEventListener('DOMContentLoaded', () => {
    handleScroll();
});

// Smooth scrubbing loop (lerp) for the frames
function updateFrameScrub() {
    if (isLoaded) {
        // Interpolate index for seamless frame transitions
        currentFrameIndex += (targetFrameIndex - currentFrameIndex) * 0.15;
        
        // Snap to target if very close
        if (Math.abs(currentFrameIndex - targetFrameIndex) < 0.01) {
            currentFrameIndex = targetFrameIndex;
        }
        
        // Render the interpolated frame (rounded to nearest integer)
        drawFrame(Math.round(currentFrameIndex));
        
        // Auto-scroll when the video sequence is finished (reaches the final frame)
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
        const viewportHeight = window.innerHeight;
        if (currentFrameIndex >= 141.8 && !hasAutoScrolledToSec2 && scrollTop > viewportHeight * 1.5) {
            hasAutoScrolledToSec2 = true;
            const sec2 = document.getElementById('seccion-2');
            if (sec2) {
                sec2.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
    requestAnimationFrame(updateFrameScrub);
}
// Start frame scrubbing engine
updateFrameScrub();


/* ==========================================================================
   SECTION 1: SMOKE EFFECT (CANVAS)
   ========================================================================== */
const smokeCanvas = document.getElementById('smoke-canvas');
const ctx = smokeCanvas.getContext('2d');

let smokeParticles = [];
let mouse = { x: 0, y: 0 };
let isMouseInSec1 = false;

// Jewel tones palette
const jewelColors = [
    { r: 192, g: 38, b: 211 }, // Magenta (#c026d3)
    { r: 124, g: 58, b: 237 }, // Violet (#7c3aed)
    { r: 37, g: 99, b: 235 }   // Blue (#2563eb)
];

function resizeSmokeCanvas() {
    if (smokeCanvas && section1) {
        smokeCanvas.width = window.innerWidth;
        smokeCanvas.height = window.innerHeight;
    }
}
window.addEventListener('resize', resizeSmokeCanvas);
resizeSmokeCanvas();

// Smoke Particle Class
class SmokeParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.6;
        this.vy = -Math.random() * 1.5 - 0.6;
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        
        this.size = Math.random() * 15 + 20; 
        this.maxSize = Math.random() * 80 + 90; 
        
        this.life = 1.0; 
        this.decay = Math.random() * 0.007 + 0.005; 
        
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.012;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        this.vx += (Math.random() - 0.5) * 0.06;
        this.size += (this.maxSize - this.size) * 0.02;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const alpha = Math.max(0, this.life * 0.22);
        const grad = ctx.createRadialGradient(0, 0, this.size * 0.05, 0, 0, this.size);
        grad.addColorStop(0, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`);
        grad.addColorStop(0.3, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha * 0.5})`);
        grad.addColorStop(0.7, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha * 0.15})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Track mouse position on Section 1 container
if (section1) {
    section1.addEventListener('mousemove', (e) => {
        if (!smokeCanvas) return;
        const rect = smokeCanvas.getBoundingClientRect();
        
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        isMouseInSec1 = true;
        
        for (let i = 0; i < 2; i++) {
            const randomColor = jewelColors[Math.floor(Math.random() * jewelColors.length)];
            smokeParticles.push(new SmokeParticle(mouse.x, mouse.y, randomColor));
        }
    });

    section1.addEventListener('mouseleave', () => {
        isMouseInSec1 = false;
    });
}

function animateSmoke() {
    if (smokeCanvas && ctx) {
        ctx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
            const p = smokeParticles[i];
            p.update();
            
            if (p.life <= 0) {
                smokeParticles.splice(i, 1);
            } else {
                p.draw();
            }
        }
    }
    requestAnimationFrame(animateSmoke);
}
animateSmoke();


/* ==========================================================================
   SECTION 2: SPOTLIGHT POSITION TRACKING (CSS VARIABLE DRIVEN)
   ========================================================================== */
const section2 = document.getElementById('seccion-2');
if (section2) {
    section2.addEventListener('mousemove', (e) => {
        const rect = section2.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        section2.style.setProperty('--mouse-x', `${x}px`);
        section2.style.setProperty('--mouse-y', `${y}px`);
    });
}


/* ==========================================================================
   SECTION 5: GOLD DUST EFFECT (CANVAS)
   ========================================================================== */
const goldContainer = document.querySelector('.gold-dust-container');
if (goldContainer) {
    const goldCanvas = document.createElement('canvas');
    goldCanvas.className = 'smoke-canvas';
    goldContainer.appendChild(goldCanvas);
    const gCtx = goldCanvas.getContext('2d');

    let goldParticles = [];

    function resizeGoldCanvas() {
        goldCanvas.width = goldContainer.clientWidth || window.innerWidth;
        goldCanvas.height = goldContainer.clientHeight || window.innerHeight;
    }
    window.addEventListener('resize', resizeGoldCanvas);
    resizeGoldCanvas();

    class GoldParticle {
        constructor() {
            this.reset(true);
        }
        
        reset(initial = false) {
            this.x = Math.random() * goldCanvas.width;
            this.y = initial ? Math.random() * goldCanvas.height : goldCanvas.height + 15;
            this.size = Math.random() * 2.2 + 0.4;
            
            this.speedY = Math.random() * 0.7 + 0.2;
            this.speedX = (Math.random() - 0.5) * 0.4;
            
            this.alpha = Math.random() * 0.45 + 0.15;
            this.maxAlpha = this.alpha;
            this.fadeSpeed = Math.random() * 0.004 + 0.001;
        }
        
        update() {
            this.y -= this.speedY;
            this.x += this.speedX;
            
            if (this.y < 120) {
                this.alpha -= 0.005;
            }
            
            if (this.y < 0 || this.alpha <= 0) {
                this.reset(false);
            }
        }
        
        draw() {
            gCtx.beginPath();
            gCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            gCtx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, this.alpha)})`;
            
            gCtx.shadowBlur = this.size * 3;
            gCtx.shadowColor = 'rgba(251, 191, 36, 0.45)';
            
            gCtx.fill();
            gCtx.shadowBlur = 0; 
        }
    }

    const maxGoldParticles = 45;
    for (let i = 0; i < maxGoldParticles; i++) {
        goldParticles.push(new GoldParticle());
    }

    const sec5Element = document.getElementById('seccion-5');

    function animateGold() {
        if (sec5Element && sec5Element.classList.contains('active')) {
            gCtx.clearRect(0, 0, goldCanvas.width, goldCanvas.height);
            
            for (let i = 0; i < goldParticles.length; i++) {
                goldParticles[i].update();
                goldParticles[i].draw();
            }
        } else {
            gCtx.clearRect(0, 0, goldCanvas.width, goldCanvas.height);
        }
        
        requestAnimationFrame(animateGold);
    }
    animateGold();
}

/* ==========================================================================
   TITLE SCRAMBLE EFFECT HELPER (DECODER STYLE FOR MONOSPACE TITLES)
   ========================================================================== */
function runTitleScramble(titleEl) {
    if (!titleEl || titleEl.classList.contains('scrambled')) return;
    
    // Cache original text on dataset
    if (!titleEl.dataset.original) {
        titleEl.dataset.original = titleEl.innerText;
    }
    
    titleEl.classList.add('scrambled');
    const originalText = titleEl.dataset.original;
    const chars = '01$_%/[]\\<>+*-+=~@!?#';
    let iterations = 0;
    
    if (titleEl.scrambleInterval) clearInterval(titleEl.scrambleInterval);
    
    titleEl.scrambleInterval = setInterval(() => {
        titleEl.innerText = originalText
            .split('')
            .map((char, index) => {
                if (char === ' ') return ' ';
                if (index < iterations) {
                    return originalText[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
        
        if (iterations >= originalText.length) {
            clearInterval(titleEl.scrambleInterval);
            titleEl.innerText = originalText;
        }
        
        iterations += 1/3; // Reveal speed
    }, 25);
}

function resetTitleScramble(titleEl) {
    if (!titleEl) return;
    titleEl.classList.remove('scrambled');
    if (titleEl.scrambleInterval) {
        clearInterval(titleEl.scrambleInterval);
    }
    if (titleEl.dataset.original) {
        titleEl.innerText = titleEl.dataset.original;
    }
}

/* ==========================================================================
   INTERSECTION OBSERVER FOR SECTION TRANSITIONS (ACTIVE CLASSES)
   ========================================================================== */
const animatedSections = document.querySelectorAll('.section:not(#seccion-1)');
const scrollMainContainer = document.getElementById('scroll-main');

const sectionObserverOptions = {
    root: scrollMainContainer || null,
    rootMargin: '0px',
    threshold: 0.4 // Trigger when 40% of the section is visible in the viewport
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            
            // Trigger the Section 2 counter animation when it enters the viewport
            if (entry.target.id === 'seccion-2') {
                runSection2Counter();
            }
            
            // Trigger Section 3 title scramble decoder
            if (entry.target.id === 'seccion-3') {
                runTitleScramble(entry.target.querySelector('.main-title'));
            }
        } else {
            entry.target.classList.remove('active');
            
            // Reset the counter when scrolling away so it can replay
            if (entry.target.id === 'seccion-2') {
                resetSection2Counter();
            }
            
            // Reset Section 3 title scramble state
            if (entry.target.id === 'seccion-3') {
                resetTitleScramble(entry.target.querySelector('.main-title'));
            }
        }
    });
}, sectionObserverOptions);

animatedSections.forEach(sec => {
    sectionObserver.observe(sec);
});

/* ==========================================================================
   SECTION 2: DYNAMIC CONTROLLER FOR COUNTING NUMBERS
   ========================================================================== */
function runSection2Counter() {
    const counterEl = document.querySelector('.counter-number');
    if (counterEl && !counterEl.classList.contains('counted')) {
        counterEl.classList.add('counted');
        let currentVal = 0;
        const targetVal = parseInt(counterEl.getAttribute('data-target')) || 150;
        const duration = 1600; // 1.6s duration
        const startTime = performance.now();
        
        counterEl.style.filter = 'blur(6px)';
        counterEl.style.transition = 'filter 1.6s cubic-bezier(0.22, 1, 0.36, 1)';
        
        function animateCounter(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            currentVal = Math.floor(easeProgress * targetVal);
            counterEl.innerText = `+${currentVal}%`;
            
            // Reduce blur
            counterEl.style.filter = `blur(${6 * (1 - easeProgress)}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(animateCounter);
            } else {
                counterEl.innerText = `+${targetVal}%`;
                counterEl.style.filter = 'none';
            }
        }
        requestAnimationFrame(animateCounter);
    }
}

function resetSection2Counter() {
    const counterEl = document.querySelector('.counter-number');
    if (counterEl) {
        counterEl.classList.remove('counted');
        counterEl.innerText = '0%';
        counterEl.style.filter = 'blur(6px)';
    }
}

/* ==========================================================================
   SECTION 3: 3D CAR CANVAS WEBGL ENGINE (THREE.JS)
   ========================================================================== */
function init3DCar() {
    const canvas = document.getElementById('car-3d-canvas');
    if (!canvas) return;

    const section3 = document.getElementById('seccion-3');
    if (!section3) return;

    // 1. Scene, Camera, and Renderer Setup
    const scene = new THREE.Scene();

    // Set camera perspective focusing on the center
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.2, 5.0);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent background to see the section gradients
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Raycaster for detailed surface-aligned flashlight effect
    const raycaster = new THREE.Raycaster();

    // 2. Lighting Setup
    // Ambient and Directional Lights are set to 0.002 to show a very subtle silhouette of the rotating car,
    // keeping the details/colors pitch black unless illuminated by the cursor's spotlight.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.002); 
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x10b981, 0.002); 
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc026d3, 0.001); 
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    // Highly localized Cyan Point Light for spotlight effect (flashlight)
    // Decreased distance to 3.0 and increased decay to 2.0 to focus it under the cursor.
    const pointLight = new THREE.PointLight(0x00f3ff, 0.0, 3.0, 2.0); 
    pointLight.position.set(0, 0.2, 2);
    scene.add(pointLight);

    // Very subtle volumetric/sweep light that slowly travels along the silhouette to highlight curves and materials
    const sweepLight = new THREE.PointLight(0x00f3ff, 0.0, 3.5, 1.8);
    scene.add(sweepLight);

    // 3. Load 3D Model
    const loader = new GLTFLoader();
    let carModel = null;
    let originalMaxDim = 1.0;

    // Function to calculate and update model size to be exactly 90% of viewport size
    function updateCarScale() {
        if (!carModel || !originalMaxDim) return;

        // Determine visible viewport height and width in 3D scene units at z = 0
        const frustumHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        const frustumWidth = frustumHeight * camera.aspect;

        // Target: 90% of the screen dimensions
        const targetWidth = frustumWidth * 0.90;
        const targetHeight = frustumHeight * 0.90;

        // Scale factor to fit the car inside the 90% viewport bounds on all devices
        const scale = Math.min(targetWidth / originalMaxDim, targetHeight / originalMaxDim);
        carModel.scale.set(scale, scale, scale);
    }

    loader.load(
        '/models/car/scene.gltf',
        (gltf) => {
            carModel = gltf.scene;
            
            // Center model geometry
            const box = new THREE.Box3().setFromObject(carModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            carModel.position.x += (carModel.position.x - center.x);
            carModel.position.y += (carModel.position.y - center.y) - 0.15; // Slightly offset downward
            carModel.position.z += (carModel.position.z - center.z);
            
            // Record original maximum dimension
            originalMaxDim = Math.max(size.x, size.y, size.z);
            
            // Set 90% screen scale initially
            updateCarScale();

            // Add shadow rendering and material parameters safely supporting material arrays
            carModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        const materials = Array.isArray(node.material) ? node.material : [node.material];
                        materials.forEach((mat) => {
                            if (mat.roughness !== undefined && mat.roughness !== null) {
                                mat.roughness = Math.min(mat.roughness, 0.4);
                            }
                            if (mat.metalness !== undefined && mat.metalness !== null) {
                                mat.metalness = Math.max(mat.metalness, 0.85);
                            }
                        });
                    }
                }
            });

            scene.add(carModel);
        },
        undefined,
        (error) => {
            console.error('Error loading 3D car model:', error);
        }
    );

    // 4. Hover, Drag State, and Math variables
    let isHovered = false;
    let isMouseDown = false;
    let isDragging = false;
    const previousMousePosition = { x: 0, y: 0 };

    let targetRotationSpeed = 0.003;
    let currentRotationSpeed = 0.003;
    
    let targetPointLightIntensity = 0.0;
    let currentPointLightIntensity = 0.0;

    let sweepTime = 0.0; // Math variable for animating the slow silhouette highlight light sweep

    const mouse = new THREE.Vector2();

    section3.addEventListener('mouseenter', () => {
        isHovered = true;
    });

    section3.addEventListener('mouseleave', () => {
        isHovered = false;
        targetRotationSpeed = 0.003; // Return to slow rotation when cursor leaves
        targetPointLightIntensity = 0.0; // Dim spotlight
        isMouseDown = false;
        isDragging = false;
        document.body.style.cursor = 'auto';

        // Reset title spotlight
        const title = section3.querySelector('.main-title');
        if (title) {
            title.style.setProperty('--mouse-x', '-500px');
            title.style.setProperty('--mouse-y', '-500px');
        }
    });

    section3.addEventListener('mousedown', (e) => {
        if (!carModel || !section3.classList.contains('active')) return;
        
        // Raycast to check if clicking directly on the car model
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(carModel, true);
        
        if (intersects.length > 0) {
            isMouseDown = true;
            isDragging = true;
            previousMousePosition.x = e.clientX;
            previousMousePosition.y = e.clientY;
            document.body.style.cursor = 'grabbing';
        }
    });

    // Handle mouse up globally to prevent sticky dragging if released outside
    const handleMouseUpGlobal = () => {
        if (isMouseDown) {
            isMouseDown = false;
            isDragging = false;
            document.body.style.cursor = 'auto';
        }
    };
    window.addEventListener('mouseup', handleMouseUpGlobal);

    section3.addEventListener('mousemove', (e) => {
        // Map mouse position to normalized coords (-1 to +1)
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // Apply mouse spotlight effect coordinates to Section 3 Title
        const title = section3.querySelector('.main-title');
        if (title) {
            const rect = title.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            title.style.setProperty('--mouse-x', `${x}px`);
            title.style.setProperty('--mouse-y', `${y}px`);
        }

        // Apply drag-to-rotate interaction if mouse is dragging the car
        if (isMouseDown && isDragging && carModel) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            // Adjust rotation sensitivities
            carModel.rotation.y += deltaX * 0.008;
            carModel.rotation.x += deltaY * 0.008;
            
            // Clamp X rotation (tilt) to prevent flipping upside down
            carModel.rotation.x = Math.max(-0.4, Math.min(0.4, carModel.rotation.x));
            
            previousMousePosition.x = e.clientX;
            previousMousePosition.y = e.clientY;
        }
    });

    // 5. Responsive Resize handler
    function resize3D() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateCarScale();
    }
    window.addEventListener('resize', resize3D);

    // 6. Animation / Render loop
    function animate3D() {
        requestAnimationFrame(animate3D);

        // Optimization: Render only when Section 3 is visible or near the viewport
        const scrollTop = scrollMainContainer ? scrollMainContainer.scrollTop : 0;
        const viewportHeight = window.innerHeight;
        const isNear = (scrollTop > viewportHeight * 5.2 && scrollTop < viewportHeight * 8.8);
        
        if (!isNear && !section3.classList.contains('active')) return;

        // Force slow speed and turn off light if the section is not active
        if (!section3.classList.contains('active')) {
            isHovered = false;
            targetRotationSpeed = 0.003;
            targetPointLightIntensity = 0.0;
            isMouseDown = false;
            isDragging = false;
        }

        // Raycasting to track the car surface and set speed/light dynamically
        let isIntersectingCar = false;
        if (isHovered && carModel && section3.classList.contains('active')) {
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(carModel, true);
            
            if (intersects.length > 0) {
                isIntersectingCar = true;
                const intersectPoint = intersects[0].point;
                
                // Position light exactly on the mesh intersection point, offset slightly along Z to illuminate
                pointLight.position.copy(intersectPoint);
                pointLight.position.z += 0.3;
                
                targetPointLightIntensity = 20.0; // Intense neon glow
                
                // Update cursor to indicate grab state when not dragging
                if (!isMouseDown) {
                    document.body.style.cursor = 'grab';
                }
            } else {
                targetPointLightIntensity = 0.0; // Dark off-model
                if (!isMouseDown) {
                    document.body.style.cursor = 'auto';
                }
            }
        } else {
            targetPointLightIntensity = 0.0;
            if (!isMouseDown) {
                document.body.style.cursor = 'auto';
            }
        }

        // Determine rotation speed: Accelerate ONLY when cursor is directly hovering over the car
        if (isIntersectingCar) {
            targetRotationSpeed = 0.045; // Fast spin
        } else {
            targetRotationSpeed = 0.003; // Slow spin
        }

        // Smoothly interpolate rotation speed (lerp)
        currentRotationSpeed += (targetRotationSpeed - currentRotationSpeed) * 0.04;
        
        // Smoothly interpolate spotlight intensity (lerp)
        currentPointLightIntensity += (targetPointLightIntensity - currentPointLightIntensity) * 0.06;

        // Update and animate the subtle silhouette sweep light position and breathing intensity
        sweepTime += 0.006;
        sweepLight.position.x = Math.sin(sweepTime) * 2.2;
        sweepLight.position.y = Math.cos(sweepTime * 0.7) * 0.15 + 0.1;
        sweepLight.position.z = 0.8;
        sweepLight.intensity = 0.45 + Math.sin(sweepTime * 1.5) * 0.15;

        ambientLight.intensity = 0.002;
        dirLight1.intensity = 0.002; // Very dim silhouette
        dirLight2.intensity = 0.001;
        pointLight.intensity = currentPointLightIntensity;

        // Rotate/animate car
        if (carModel) {
            if (!isDragging) {
                // Rotate car slowly all the time (speed up only on hover)
                carModel.rotation.y += currentRotationSpeed;
                // Return X rotation (tilt) back to flat orientation slowly
                carModel.rotation.x += (0 - carModel.rotation.x) * 0.05;
            }
        }

        renderer.render(scene, camera);
    }
    animate3D();
}

/* ==========================================================================
   SECTION 4: SQUADS OF EXECUTION & PROTOCOL CONFIGURATOR
   ========================================================================== */
function initProtocolConfigurator() {
    const selectorCards = document.querySelectorAll('.squad-card');
    const consoleCode = document.getElementById('active-squad-code');
    const consoleTitle = document.getElementById('console-squad-title');
    const consoleCatalogList = document.getElementById('console-catalog-list');
    const consolePrice = document.getElementById('console-price');
    
    const fillUx = document.getElementById('fill-ux');
    const fillAuto = document.getElementById('fill-auto');
    const fillIa = document.getElementById('fill-ia');
    
    const valUx = document.getElementById('val-ux');
    const valAuto = document.getElementById('val-auto');
    const valIa = document.getElementById('val-ia');

    if (!selectorCards.length || !consoleCatalogList) return;

    // Catálogo de Servicios con Estructura de Valor Percibido de Elite
    const SQUAD_DATA = {
        'nivel-01': {
            code: 'PROTOCOL // SEC_04_N1',
            title: 'PROTOCOL: ESTABILIZACIÓN',
            price: 'Consultar Inversión',
            metrics: { ux: 90, auto: 30, ia: 25 },
            catalog: [
                { module: 'Diagnóstico', service: 'Auditoría 360°', value: 'Claridad y detección de fugas de dinero.' },
                { module: 'Infraestructura', service: 'Web de Alto Rendimiento', value: 'Autoridad y máxima conversión.' },
                { module: 'Optimización', service: 'SEO Técnico', value: 'Visibilidad orgánica dominante.' },
                { module: 'Continuidad', service: 'Mantenimiento Evolutivo', value: 'Protección de la inversión y actualizaciones.' }
            ]
        },
        'nivel-02': {
            code: 'PROTOCOL // SEC_04_N2',
            title: 'PROTOCOL: ESCALAMIENTO',
            price: 'Consultar Inversión',
            metrics: { ux: 95, auto: 80, ia: 60 },
            catalog: [
                { module: 'Diagnóstico', service: 'Auditoría 360°', value: 'Claridad y detección de fugas de dinero.' },
                { module: 'Infraestructura', service: 'Web de Alto Rendimiento', value: 'Autoridad y máxima conversión.' },
                { module: 'Growth', service: 'Automatización e IA', value: 'Eficiencia operativa y escalabilidad de procesos.' },
                { module: 'Continuidad', service: 'Mantenimiento Evolutivo', value: 'Protección de la inversión y actualizaciones.' }
            ]
        },
        'nivel-03': {
            code: 'PROTOCOL // SEC_04_N3',
            title: 'PROTOCOL: DOMINIO',
            price: 'COTIZACIÓN CUSTOM',
            metrics: { ux: 99, auto: 99, ia: 95 },
            catalog: [
                { module: 'Estrategia', service: 'Fractional CTO/CMO', value: 'Dirección tecnológica y plan trimestral de crecimiento.' },
                { module: 'Growth', service: 'Automatización & IA Custom', value: 'Eficiencia operativa de flujos e IA a medida.' },
                { module: 'Activos', service: 'Producción Elite', value: 'Modelado 3D y activos de impacto.' },
                { module: 'Continuidad', service: 'Mantenimiento Evolutivo', value: 'Protección de la inversión y actualizaciones prioritarias.' }
            ]
        }
    };

    function updateConsole(squadKey) {
        const data = SQUAD_DATA[squadKey];
        if (!data) return;

        // Update Text
        if (consoleCode) consoleCode.innerText = data.code;
        if (consoleTitle) consoleTitle.innerText = data.title;
        if (consolePrice) consolePrice.innerText = data.price;

        // Update Catalog Grid
        consoleCatalogList.innerHTML = '';
        data.catalog.forEach(item => {
            const row = document.createElement('div');
            row.className = 'catalog-row';
            row.innerHTML = `
                <div class="catalog-service-name">
                    <span class="catalog-service-label">${item.module}</span>
                    <span>${item.service}</span>
                </div>
                <div class="catalog-service-value">${item.value}</div>
            `;
            consoleCatalogList.appendChild(row);
        });

        // Update Metric Bars and Labels
        if (fillUx) fillUx.style.width = `${data.metrics.ux}%`;
        if (fillAuto) fillAuto.style.width = `${data.metrics.auto}%`;
        if (fillIa) fillIa.style.width = `${data.metrics.ia}%`;

        if (valUx) valUx.innerText = `${data.metrics.ux}%`;
        if (valAuto) valAuto.innerText = `${data.metrics.auto}%`;
        if (valIa) valIa.innerText = `${data.metrics.ia}%`;
    }

    // Attach click events to cards
    selectorCards.forEach(card => {
        card.addEventListener('click', () => {
            selectorCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const squadKey = card.getAttribute('data-squad');
            updateConsole(squadKey);
        });
    });

    // Initialize with first squad on page load
    updateConsole('nivel-01');
}

/* ==========================================================================
   SECTION 5: TELEMETRY PANEL CONTROLLER (CONFIANZA)
   ========================================================================== */
function initTelemetryPanel() {
    const kpiBoxes = document.querySelectorAll('.kpi-box');
    const metricName = document.getElementById('telemetry-metric-name');
    const metricDesc = document.getElementById('telemetry-metric-desc');

    if (!kpiBoxes.length || !metricName || !metricDesc) return;

    // Add styles dynamically for seamless text transitions
    metricName.style.transition = 'opacity 0.15s ease-in-out';
    metricDesc.style.transition = 'opacity 0.15s ease-in-out';

    const TELEMETRY_DATA = {
        'perf': {
            name: 'Rendimiento Lighthouse',
            desc: 'Cada línea de código se somete a pruebas automáticas de rendimiento. Optimizamos imágenes en formatos modernos, minimizamos el tamaño de bundles de JavaScript y garantizamos un renderizado inicial inmediato para alcanzar la máxima calificación en Core Web Vitals.'
        },
        'uptime': {
            name: 'Disponibilidad de Servidores (Uptime)',
            desc: 'Nuestra arquitectura se despliega en redes de distribución de contenido (CDNs) y servidores redundantes con auto-escalado horizontal. Monitoreamos activamente el estado de la red para garantizar una resiliencia del 99.99% ante picos masivos de tráfico.'
        },
        'roi': {
            name: 'Retorno de Inversión Promedio (ROI)',
            desc: 'Medimos de forma transparente el impacto de cada optimización. Reduciendo la fricción en el checkout e implementando cargas instantáneas, nuestros clientes experimentan un incremento promedio del +240% en su retorno de inversión digital.'
        },
        'lat': {
            name: 'Latencia de API Global',
            desc: 'Utilizamos APIs distribuidas geográficamente y bases de datos descentralizadas (Edge Computing). Esto reduce la distancia física entre el servidor y tus usuarios, logrando tiempos de respuesta de tan solo 14 milisegundos.'
        }
    };

    kpiBoxes.forEach(box => {
        box.addEventListener('click', () => {
            kpiBoxes.forEach(b => b.classList.remove('active'));
            box.classList.add('active');

            const kpiKey = box.getAttribute('data-kpi');
            const data = TELEMETRY_DATA[kpiKey];
            if (data) {
                metricName.style.opacity = 0;
                metricDesc.style.opacity = 0;
                
                setTimeout(() => {
                    metricName.innerText = data.name;
                    metricDesc.innerText = data.desc;
                    metricName.style.opacity = 1;
                    metricDesc.style.opacity = 1;
                }, 150);
            }
        });
    });
}

/* ==========================================================================
   SECTION 6: CONTACT FORM PROTOCOL SELECTOR & SUBMIT (CONTACTO)
   ========================================================================== */
function initContactForm() {
    const tierButtons = document.querySelectorAll('.tier-btn');
    const selectedProtocolInput = document.getElementById('selected-protocol');
    const contactForm = document.getElementById('kuvra-contact-form');

    if (tierButtons.length && selectedProtocolInput) {
        tierButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tierButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tierVal = btn.getAttribute('data-tier');
                selectedProtocolInput.value = tierVal;
            });
        });
    }

    if (contactForm) {
        // Simple HTML sanitization helper to prevent XSS
        function sanitizeInput(str) {
            if (typeof str !== 'string') return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('contact-name');
            const companyInput = document.getElementById('contact-company');
            const emailInput = document.getElementById('contact-email');
            const messageInput = document.getElementById('contact-message');

            const emailVal = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(emailVal)) {
                alert('Por favor, ingresa un correo electrónico corporativo válido.');
                emailInput.focus();
                return;
            }
            
            const name = sanitizeInput(nameInput.value.trim());
            const company = sanitizeInput(companyInput.value.trim());
            const email = sanitizeInput(emailVal);
            const protocol = sanitizeInput(selectedProtocolInput ? selectedProtocolInput.value : 'nivel-01');
            const message = sanitizeInput(messageInput.value.trim());

            console.log('Protocol Activation Requested:', { name, company, email, protocol, message });
            alert(`¡Protocolo de conexión activado!\n\nNombre: ${name}\nEmpresa: ${company}\nEmail: ${email}\nProtocolo de Interés: ${protocol}\n\nNos pondremos en contacto en menos de 45 minutos.`);
            
            contactForm.reset();
            if (tierButtons.length) {
                tierButtons.forEach(b => b.classList.remove('active'));
                tierButtons[0].classList.add('active');
            }
            if (selectedProtocolInput) {
                selectedProtocolInput.value = 'nivel-01';
            }
        });
    }
}

/* ==========================================================================
   SECTION 2: DYNAMIC CONSTELLATION DATA PARTICLES (SERVICIOS)
   ========================================================================== */
function initServicesBgCanvas() {
    const canvas = document.getElementById('services-bg-canvas');
    if (!canvas) return;

    const section2 = document.getElementById('seccion-2');
    if (!section2) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId = null;
    let width = canvas.width = section2.clientWidth || window.innerWidth;
    let height = canvas.height = section2.clientHeight || window.innerHeight;

    const mouse = { x: -1000, y: -1000, radius: 180 };

    function resizeCanvas() {
        width = canvas.width = section2.clientWidth || window.innerWidth;
        height = canvas.height = section2.clientHeight || window.innerHeight;
        init();
    }

    window.addEventListener('resize', resizeCanvas);

    section2.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    section2.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 1.8 + 0.6;
            
            // Random movement speeds
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;

            // Color mix of blue and violet/magenta
            const isBlue = Math.random() > 0.4;
            this.color = isBlue ? 'rgba(37, 99, 235, 0.45)' : 'rgba(192, 38, 211, 0.45)';
        }

        update() {
            // Natural drifting movement
            this.x += this.vx;
            this.y += this.vy;

            // Screen boundaries wrap around
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;

            // Mouse interaction (Atracción sutil hacia el mouse si está cerca)
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const directionX = (dx / distance) * force * 1.5;
                const directionY = (dy / distance) * force * 1.5;
                
                this.x += directionX;
                this.y += directionY;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function init() {
        particles = [];
        // Determine number of particles based on screen width
        const numberOfParticles = Math.floor((width * height) / 18000);
        for (let i = 0; i < numberOfParticles; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        if (section2.classList.contains('active')) {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }

            // Draw connection lines between nearby particles and mouse
            connect();
            
            animationFrameId = requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, width, height);
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function connect() {
        let maxDistance = 100;
        for (let a = 0; a < particles.length; a++) {
            // Connect to mouse if close
            let dxMouse = mouse.x - particles[a].x;
            let dyMouse = mouse.y - particles[a].y;
            let distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
            if (distMouse < mouse.radius) {
                let opacity = (1 - (distMouse / mouse.radius)) * 0.18;
                ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }

            // Connect to other nearby particles
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * 0.08;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    init();
    
    // Watch for Section 2 active class changes to trigger/pause render loop
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (section2.classList.contains('active')) {
                    if (!animationFrameId) {
                        animate();
                    }
                } else {
                    if (animationFrameId) {
                        ctx.clearRect(0, 0, width, height);
                        cancelAnimationFrame(animationFrameId);
                        animationFrameId = null;
                    }
                }
            }
        });
    });

    observer.observe(section2, { attributes: true });

    // Initial check
    if (section2.classList.contains('active')) {
        animate();
    }
}

// Initialize when DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
    init3DCar();
    initProtocolConfigurator();
    initTelemetryPanel();
    initContactForm();
    initServicesBgCanvas();
});
