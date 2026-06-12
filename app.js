/* ==========================================================================
   KUVRA FORGE // INTERACTION ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. HUD CURSOR (MIRA DE INSPECCIÓN)
       ========================================================================== */
    const hudCursor = document.getElementById('hud-cursor');
    const hudTelemetry = document.getElementById('hud-telemetry-text');
    
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    const lerpFactor = 0.15; // Smooth cursor follow

    if (hudCursor) {
        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });

        // Main animation loop for the custom cursor
        const animateCursor = () => {
            currentX += (targetX - currentX) * lerpFactor;
            currentY += (targetY - currentY) * lerpFactor;
            
            hudCursor.style.left = `${currentX}px`;
            hudCursor.style.top = `${currentY}px`;
            
            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        // Custom Hover Telemetry Details
        const interactiveElements = document.querySelectorAll('a, button, .squad-card, .console-btn, .select-btn, .toggle-mode-btn, .gallery-item, .hardware-card');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                hudCursor.classList.add('hovering');
                
                // Set custom telemetry text depending on hover item
                if (el.tagName === 'A') {
                    const text = el.innerText.trim() || 'ENLACE';
                    hudTelemetry.innerText = `SYS_NAV // ${text.toUpperCase()}`;
                } else if (el.classList.contains('toggle-mode-btn')) {
                    hudTelemetry.innerText = `MODE_SWITCH // VISTA_CAD`;
                } else if (el.classList.contains('console-btn')) {
                    const type = el.getAttribute('data-type').toUpperCase();
                    const val = el.getAttribute('data-value').toUpperCase();
                    hudTelemetry.innerText = `INJECT_CMD // ${type}_${val}`;
                } else if (el.classList.contains('select-btn')) {
                    const sys = el.getAttribute('data-system').toUpperCase();
                    hudTelemetry.innerText = `SET_SYSTEM // ${sys}`;
                } else if (el.classList.contains('gallery-item')) {
                    hudTelemetry.innerText = `SCANNING_PROJECT // 100%`;
                } else {
                    hudTelemetry.innerText = `INSPECT // ITEM_ACTIVO`;
                }
            });

            el.addEventListener('mouseleave', () => {
                hudCursor.classList.remove('hovering');
                hudTelemetry.innerText = 'SYS_SCAN // IDLE';
            });
        });
    }


    /* ==========================================================================
       2. CAD PRELOADER SIMULATION
       ========================================================================== */
    const preloader = document.getElementById('preloader');
    const progressFill = document.getElementById('load-progress-fill');
    const statusText = document.getElementById('load-status-text');
    
    if (preloader && progressFill && statusText) {
        let progress = 0;
        const statusLogs = [
            'SYS_CHECK: OK // BOOTING KUVRA_SYS...',
            'ESTABLISHING CONNECTION // CORE_PORT_23...',
            'SCANNING GEOMETRIC RATIOS // CAD_UNIT...',
            'LOADING METAL ALLOYS // STEEL_AISI_1020...',
            'INJECTING ORGANIC SUSTRATES // OAK_COAT...',
            'INITIALIZING HÁBITAT SIMULATION // OK'
        ];

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 4;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                statusText.innerText = 'SYSTEM_READY // INICIANDO CORE';
                setTimeout(() => {
                    preloader.classList.add('loaded');
                }, 400);
            } else {
                // Update percentage width
                progressFill.style.width = `${progress}%`;
                
                // Cycle through progress log text
                const logIndex = Math.floor((progress / 100) * statusLogs.length);
                if (statusLogs[logIndex]) {
                    statusText.innerText = statusLogs[logIndex];
                }
            }
        }, 120);
    }


    /* ==========================================================================
       3. SCROLL TELEMETRY PERCENTAGE & LASER TRACKER
       ========================================================================== */
    const scrollMain = document.getElementById('scroll-main');
    const scrollPercentage = document.getElementById('scroll-percentage');
    const laserDot = document.getElementById('laser-dot');

    if (scrollMain && scrollPercentage && laserDot) {
        scrollMain.addEventListener('scroll', () => {
            const scrollTop = scrollMain.scrollTop;
            const scrollHeight = scrollMain.scrollHeight - scrollMain.clientHeight;
            
            // Calculate percentage
            const percentageVal = Math.round((scrollTop / scrollHeight) * 100);
            
            // Pad percentage to 3 digits (e.g. "000%", "042%")
            scrollPercentage.innerText = `${String(percentageVal).padStart(3, '0')}%`;
            
            // Update laser scanner dot Y position along the 100px line
            laserDot.style.top = `${percentageVal}%`;
        });
    }


    /* ==========================================================================
       4. VIEWER CAD TOGGLE (HARDWARE CARDS)
       ========================================================================== */
    const toggleButtons = document.querySelectorAll('.toggle-mode-btn');

    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const cardViewer = btn.closest('.card-viewer');
            const btnText = btn.querySelector('.btn-text');
            
            if (cardViewer && btnText) {
                const isCadActive = cardViewer.classList.toggle('cad-active');
                if (isCadActive) {
                    btnText.innerText = 'VER FOTO REAL';
                } else {
                    btnText.innerText = 'VER MODO CAD';
                }
                
                // Add click pulse telemetry feedback
                if (hudCursor) {
                    hudTelemetry.innerText = isCadActive ? 'MODE_SWITCH // WIREFRAME' : 'MODE_SWITCH // FOTOREAL';
                }
            }
        });
    });


    /* ==========================================================================
       5. CONFIGURATOR SIMULATOR (WOOD & METAL INJECTION)
       ========================================================================== */
    const consoleButtons = document.querySelectorAll('.console-btn');
    const logWood = document.getElementById('log-wood');
    const logMetal = document.getElementById('log-metal');
    const logStatus = document.getElementById('log-status');
    
    const valDensity = document.getElementById('val-density');
    const valWeldColor = document.getElementById('val-weld-color');

    // Sample database values
    const WOOD_DATA = {
        'nogal': { density: '680 kg/m³', file: 'nogal_americano.mtl' },
        'roble': { density: '740 kg/m³', file: 'roble_carbonizado.mtl' },
        'pino': { density: '510 kg/m³', file: 'pino_oregon_sel.mtl' }
    };

    const METAL_DATA = {
        'cobre': { file: 'cobre_soldado.alloy', color: '#FF6B00', name: 'Cobre Al Fuego' },
        'acero': { file: 'acero_cepillado.alloy', color: '#00F0FF', name: 'Acero Gris Cepillado' },
        'hierro': { file: 'hierro_carbono.alloy', color: '#8E8A85', name: 'Hierro Carbono' }
    };

    if (consoleButtons.length) {
        consoleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                const val = btn.getAttribute('data-value');
                
                // Find all buttons of the same type and deactivate
                const siblings = btn.parentElement.querySelectorAll('.console-btn');
                siblings.forEach(s => s.classList.remove('active'));
                
                // Activate clicked button
                btn.classList.add('active');

                // Visual telemetry log updates
                if (type === 'wood') {
                    const woodSpec = WOOD_DATA[val];
                    if (woodSpec && logWood && valDensity) {
                        // Flash log line
                        logWood.classList.remove('text-cyan');
                        logWood.style.opacity = '0.3';
                        
                        setTimeout(() => {
                            logWood.innerText = `SUSTRATO_CARGADO // ${woodSpec.file}`;
                            valDensity.innerText = woodSpec.density;
                            logWood.style.opacity = '1';
                            logWood.classList.add('text-cyan');
                        }, 150);
                    }
                } else if (type === 'metal') {
                    const metalSpec = METAL_DATA[val];
                    if (metalSpec && logMetal && valWeldColor) {
                        logMetal.classList.remove('text-amber');
                        logMetal.style.opacity = '0.3';
                        
                        setTimeout(() => {
                            logMetal.innerText = `ALEACION_CARGADA // ${metalSpec.file}`;
                            valWeldColor.innerText = metalSpec.color;
                            valWeldColor.style.color = metalSpec.color;
                            logMetal.style.opacity = '1';
                            logMetal.classList.add('text-amber');
                            
                            // Visual thermal pulse alert
                            if (logStatus) {
                                logStatus.innerText = `ALERTA_SOLDADURA // PULSO TÉRMICO ACTIVO`;
                                logStatus.style.color = metalSpec.color;
                                
                                setTimeout(() => {
                                    logStatus.innerText = 'MONITOR_DE_ESTADO // SISTEMA ESTABLE';
                                    logStatus.style.color = '';
                                }, 1200);
                            }
                        }, 150);
                    }
                }
            });
        });
    }


    /* ==========================================================================
       6. INTERSECTION OBSERVER FOR ACTIVE SECTIONS
       ========================================================================== */
    const sections = document.querySelectorAll('.section');
    
    const sectionObserverOptions = {
        root: scrollMain || null,
        rootMargin: '0px',
        threshold: 0.5 // Trigger when section is 50% visible
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, sectionObserverOptions);

    sections.forEach(sec => {
        sectionObserver.observe(sec);
    });


    /* ==========================================================================
       7. CONTACT INTERACTIVE SELECT BUTTONS
       ========================================================================== */
    const selectButtons = document.querySelectorAll('.select-btn');
    const systemTypeInput = document.getElementById('system-type');

    if (selectButtons.length && systemTypeInput) {
        selectButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                selectButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sysVal = btn.getAttribute('data-system');
                systemTypeInput.value = sysVal;
            });
        });
    }

    // Form submission simulation
    const forgeForm = document.getElementById('forge-contact-form');
    if (forgeForm) {
        forgeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('lead-name');
            const orgInput = document.getElementById('lead-org');
            const emailInput = document.getElementById('lead-email');
            const specsInput = document.getElementById('lead-specs');
            const sysType = systemTypeInput.value;

            alert(`[ KUVRA FORGE // CONEXIÓN ESTABLECIDA ]\n\nFicha del Lead:\nNombre: ${nameInput.value}\nFirma: ${orgInput.value}\nEmail: ${emailInput.value}\nSistema: ${sysType.toUpperCase()}\nEspecificaciones enviadas.\n\nAnálisis de factibilidad técnica en curso (Tiempo estimado de respuesta: 45 min).`);
            
            forgeForm.reset();
            selectButtons.forEach(b => b.classList.remove('active'));
            selectButtons[0].classList.add('active');
            systemTypeInput.value = 'standard';
        });
    }
});
