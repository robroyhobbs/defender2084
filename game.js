class Lander {
    constructor(scene, position, astronauts) {
        // Create red material for lander
        const landerMaterial = new BABYLON.StandardMaterial("landerMaterial", scene);
        landerMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        landerMaterial.emissiveColor = new BABYLON.Color3(0.3, 0, 0);

        // Create sphere for lander
        this.mesh = BABYLON.MeshBuilder.CreateSphere("lander", {
            diameter: 2,
            segments: 16
        }, scene);

        // Set initial position
        this.mesh.position = position;
        this.initialZ = position.z;

        // Apply material
        this.mesh.material = landerMaterial;

        // Movement properties
        this.speed = 0.3;
        this.astronauts = astronauts || [];
    }

    update(gamePlaneZ) {
        if (!this.mesh) return;

        // Update Z position with game plane
        this.mesh.position.z = this.initialZ + gamePlaneZ;

        // Find nearest astronaut
        let nearestAstronaut = null;
        let minDistance = Infinity;

        if (this.astronauts && this.astronauts.length > 0) {
            for (const astronaut of this.astronauts) {
                if (!astronaut || !astronaut.position) continue;
                
                const distance = BABYLON.Vector3.Distance(
                    new BABYLON.Vector3(this.mesh.position.x, 0, this.mesh.position.z),
                    new BABYLON.Vector3(astronaut.position.x, 0, astronaut.position.z)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestAstronaut = astronaut;
                }
            }
        }

        // Move towards nearest astronaut
        if (nearestAstronaut && nearestAstronaut.position) {
            const direction = nearestAstronaut.position.subtract(this.mesh.position).normalize();
            this.mesh.position.x += direction.x * this.speed;
        }
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}

class Game {
    constructor(canvasId) {
        console.log('Game constructor started');
        
        // Get the canvas element
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found');
            throw new Error('Canvas element not found');
        }
        console.log('Canvas element found');

        try {
            // Generate the BABYLON 3D engine
            console.log('Creating Babylon engine...');
            this.engine = new BABYLON.Engine(this.canvas, true);
            console.log('Babylon engine created');
            
            // Initialize game properties
            console.log('Initializing game properties...');
            this.initializeGameProperties();

            // Create scene and setup game
            console.log('Creating scene...');
            this.scene = this.createScene();
            if (!this.scene) {
                throw new Error('Failed to create scene');
            }
            console.log('Scene created successfully');

            // Create GUI after scene is ready
            console.log('Creating GUI...');
            this.createGUI();
            console.log('GUI created');

            // Set up controls after GUI
            console.log('Setting up controls...');
            this.setupControls();
            console.log('Controls set up');

            // Initialize display updates
            console.log('Initializing display updates...');
            this.initializeDisplayUpdates();
            console.log('Display updates initialized');

            // Register game loop
            console.log('Setting up render loop...');
            this.setupRenderLoop();
            console.log('Render loop set up');

            console.log('Game initialization completed successfully');
        } catch (error) {
            console.error('Error during game initialization:', error);
            throw error;
        }
    }

    initializeGameProperties() {
        console.log('Initializing game arrays and properties...');
        
        // Initialize arrays
        this.astronauts = [];
        this.lasers = [];
        this.landers = [];
        this.displays = [];
        this.displayTextures = [];
        this.buttons = [];
        this.warningLights = [];

        // Game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.isRunning = false;
        this.isGameOver = false;
        
        // Game settings
        this.gameSpeed = 1;
        this.difficulty = 1;
        this.maxEnemies = 5;
        
        // Movement properties
        this.moveSpeed = 0.1;
        this.cameraXBounds = { min: -3, max: 3 };
        this.cameraYBounds = { min: 1, max: 4 };
        this.keys = {};

        // Laser properties
        this.laserSpeed = 2;
        this.canShoot = true;
        this.shootCooldown = 250;

        // Lander spawn properties
        this.landerSpawnInterval = 3000;
        this.lastLanderSpawn = 0;

        // Health and energy properties
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxEnergy = 100;
        this.energy = this.maxEnergy;
        this.energyRechargeRate = 0.2;
        this.laserEnergyCost = 10;

        // Physics properties
        this.gravity = -9.81;
        this.verticalVelocity = 0;
        this.isGrounded = false;
        this.jumpForce = 5;

        // Add mission start time
        this.startTime = Date.now();

        console.log('Game properties initialized');
    }

    setupRenderLoop() {
        console.log('Setting up render loop...');
        
        // Register a render loop to repeatedly render the scene
        this.engine.runRenderLoop(() => {
            try {
                if (this.scene && this.isRunning) {
                    // Update game logic
                    this.update();
                    // Render the scene
                    this.scene.render();
                }
            } catch (error) {
                console.error('Error in render loop:', error);
                this.isRunning = false;
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        console.log('Render loop setup complete');
    }

    createGUI() {
        if (!this.scene) return;

        try {
            // Create fullscreen UI
            this.guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

            // Create health bar container with null checks
            const healthBarContainer = new BABYLON.GUI.Rectangle();
            if (!healthBarContainer) return;

            healthBarContainer.width = "200px";
            healthBarContainer.height = "20px";
            healthBarContainer.cornerRadius = 10;
            healthBarContainer.color = "white";
            healthBarContainer.thickness = 2;
            healthBarContainer.background = "black";
            healthBarContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            healthBarContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            healthBarContainer.left = "20px";
            healthBarContainer.top = "120px";
            this.guiTexture.addControl(healthBarContainer);

            this.healthBar = new BABYLON.GUI.Rectangle();
            this.healthBar.width = "100%";
            this.healthBar.height = "100%";
            this.healthBar.background = "red";
            this.healthBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            healthBarContainer.addControl(this.healthBar);

            // Create energy bar
            const energyBarContainer = new BABYLON.GUI.Rectangle();
            energyBarContainer.width = "200px";
            energyBarContainer.height = "20px";
            energyBarContainer.cornerRadius = 10;
            energyBarContainer.color = "white";
            energyBarContainer.thickness = 2;
            energyBarContainer.background = "black";
            energyBarContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            energyBarContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            energyBarContainer.left = "20px";
            energyBarContainer.top = "150px";
            this.guiTexture.addControl(energyBarContainer);

            this.energyBar = new BABYLON.GUI.Rectangle();
            this.energyBar.width = "100%";
            this.energyBar.height = "100%";
            this.energyBar.background = "blue";
            this.energyBar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            energyBarContainer.addControl(this.energyBar);

            // Add labels for bars
            const healthLabel = new BABYLON.GUI.TextBlock();
            healthLabel.text = "HULL";
            healthLabel.color = "white";
            healthLabel.fontSize = 16;
            healthLabel.top = "120px";
            healthLabel.left = "230px";
            healthLabel.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.guiTexture.addControl(healthLabel);

            const energyLabel = new BABYLON.GUI.TextBlock();
            energyLabel.text = "ENERGY";
            energyLabel.color = "white";
            energyLabel.fontSize = 16;
            energyLabel.top = "150px";
            energyLabel.left = "230px";
            energyLabel.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.guiTexture.addControl(energyLabel);

            // Store texture for later use
            this.guiTexture = this.guiTexture;

            // Create score text
            this.scoreText = new BABYLON.GUI.TextBlock();
            this.scoreText.text = "Score: 0";
            this.scoreText.color = "white";
            this.scoreText.fontSize = 24;
            this.scoreText.top = "20px";
            this.scoreText.left = "20px";
            this.scoreText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.guiTexture.addControl(this.scoreText);

            // Create astronauts saved counter
            this.astronautsSavedText = new BABYLON.GUI.TextBlock();
            this.astronautsSavedText.text = "Astronauts Saved: 0";
            this.astronautsSavedText.color = "green";
            this.astronautsSavedText.fontSize = 24;
            this.astronautsSavedText.top = "50px";
            this.astronautsSavedText.left = "20px";
            this.astronautsSavedText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.guiTexture.addControl(this.astronautsSavedText);

            // Create landers destroyed counter
            this.landersDestroyedText = new BABYLON.GUI.TextBlock();
            this.landersDestroyedText.text = "Landers Destroyed: 0";
            this.landersDestroyedText.color = "red";
            this.landersDestroyedText.fontSize = 24;
            this.landersDestroyedText.top = "80px";
            this.landersDestroyedText.left = "20px";
            this.landersDestroyedText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.guiTexture.addControl(this.landersDestroyedText);

            // Create controls help text
            const controlsText = new BABYLON.GUI.TextBlock();
            controlsText.text = "Controls:\nArrow Keys: Move\nSpacebar: Shoot";
            controlsText.color = "white";
            controlsText.fontSize = 20;
            controlsText.top = "20px";
            controlsText.left = "-20px";
            controlsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this.guiTexture.addControl(controlsText);
        } catch (error) {
            console.error('Error creating GUI:', error);
            throw error;
        }
    }

    updateScore(points) {
        this.score += points;
        this.scoreText.text = `Score: ${this.score}`;
    }

    updateAstronautsSaved() {
        this.astronautsSaved++;
        this.astronautsSavedText.text = `Astronauts Saved: ${this.astronautsSaved}`;
        this.updateScore(100);
        this.createScoringEffect(100, { x: 0, y: 50 });
    }

    updateLandersDestroyed() {
        this.landersDestroyed++;
        this.landersDestroyedText.text = `Landers Destroyed: ${this.landersDestroyed}`;
        this.updateScore(50);
        this.createScoringEffect(50, { x: 0, y: 80 });
    }

    setupControls() {
        // Track key states
        this.moveDirection = new BABYLON.Vector3.Zero();
        this.rotationDirection = new BABYLON.Vector2.Zero();
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Handle shooting
            if (e.code === 'Space' && this.canShoot) {
                this.shootLaser();
                this.canShoot = false;
                setTimeout(() => {
                    this.canShoot = true;
                }, this.shootCooldown);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Mouse movement for looking around
        this.canvas.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.camera.rotation.y += e.movementX * 0.002;
                this.camera.rotation.x = Math.max(
                    -Math.PI / 2,
                    Math.min(Math.PI / 2, this.camera.rotation.x + e.movementY * 0.002)
                );
            }
        });

        // Lock pointer on canvas click
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });

        // Add movement update to scene
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateMovement();
            this.updateLasers();
            this.updateLanders();
        });
    }

    updateMovement() {
        if (!this.camera) return;

        const deltaTime = this.engine.getDeltaTime() / 1000.0;
        const cameraDirection = this.camera.getDirection(BABYLON.Vector3.Forward());
        const cameraRight = BABYLON.Vector3.Cross(cameraDirection, BABYLON.Vector3.Up());
        const speed = this.moveSpeed;

        // Reset movement vector
        const movement = new BABYLON.Vector3.Zero();

        // Forward/Backward
        if (this.keys['w'] || this.keys['ArrowUp']) {
            movement.addInPlace(cameraDirection.scale(speed));
        }
        if (this.keys['s'] || this.keys['ArrowDown']) {
            movement.addInPlace(cameraDirection.scale(-speed));
        }

        // Left/Right
        if (this.keys['a'] || this.keys['ArrowLeft']) {
            movement.addInPlace(cameraRight.scale(-speed));
        }
        if (this.keys['d'] || this.keys['ArrowRight']) {
            movement.addInPlace(cameraRight.scale(speed));
        }

        // Up/Down (vertical thrusters)
        if (this.keys['q']) { // Up
            this.verticalVelocity = Math.min(this.verticalVelocity + 15 * deltaTime, 5);
            this.energy = Math.max(0, this.energy - 0.5); // Use energy for vertical movement
        } else if (this.keys['e']) { // Down
            this.verticalVelocity = Math.max(this.verticalVelocity - 15 * deltaTime, -5);
            this.energy = Math.max(0, this.energy - 0.5); // Use energy for vertical movement
        }

        // Apply gravity
        this.verticalVelocity += this.gravity * deltaTime;

        // Get ground height at current position
        const groundHeight = this.gamePlane.getHeightAtCoordinates(
            this.camera.position.x, 
            this.camera.position.z
        );

        // Check for ground collision
        if (this.camera.position.y + this.verticalVelocity * deltaTime < groundHeight + 2) {
            this.camera.position.y = groundHeight + 2;
            this.verticalVelocity = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Roll left/right
        if (this.keys['z']) {
            this.camera.rotation.z = Math.min(this.camera.rotation.z + 0.02, Math.PI / 4);
        } else if (this.keys['c']) {
            this.camera.rotation.z = Math.max(this.camera.rotation.z - 0.02, -Math.PI / 4);
        } else {
            // Return to level when not rolling
            if (this.camera.rotation.z > 0.02) {
                this.camera.rotation.z -= 0.02;
            } else if (this.camera.rotation.z < -0.02) {
                this.camera.rotation.z += 0.02;
            } else {
                this.camera.rotation.z = 0;
            }
        }

        // Apply horizontal movement
        this.camera.position.addInPlace(movement);

        // Apply vertical movement
        this.camera.position.y += this.verticalVelocity * deltaTime;

        // Update camera target based on rotation
        const targetDistance = 10;
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
        const target = this.camera.position.add(forward.scale(targetDistance));
        this.camera.setTarget(target);
    }

    shootLaser() {
        if (this.energy >= this.laserEnergyCost) {
            // Create yellow material for laser
            const laserMaterial = new BABYLON.StandardMaterial("laserMaterial", this.scene);
            laserMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0); // Bright yellow
            laserMaterial.alpha = 0.8;

            // Create laser cylinder
            const laser = BABYLON.MeshBuilder.CreateCylinder("laser", {
                height: 2,
                diameter: 0.1
            }, this.scene);

            // Get the forward direction of the camera
            const forward = this.camera.getDirection(BABYLON.Vector3.Forward());

            // Position laser at camera position
            laser.position = this.camera.position.clone();

            // Calculate rotation to match camera direction
            const rotationQuaternion = BABYLON.Quaternion.FromLookDirectionRH(forward, BABYLON.Vector3.Up());
            laser.rotationQuaternion = rotationQuaternion;

            // Apply material
            laser.material = laserMaterial;

            // Store initial direction for movement
            laser.direction = forward.clone();

            // Add to lasers array
            this.lasers.push(laser);

            // Consume energy
            this.energy -= this.laserEnergyCost;
            this.updateEnergyBar();
        }
    }

    updateLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            // Move laser in its stored direction
            laser.position.addInPlace(laser.direction.scale(this.laserSpeed));

            // Check for collisions with landers
            for (let j = this.landers.length - 1; j >= 0; j--) {
                const lander = this.landers[j];
                if (laser.intersectsMesh(lander.mesh, false)) {
                    // Remove both laser and lander
                    laser.dispose();
                    this.lasers.splice(i, 1);
                    lander.dispose();
                    this.landers.splice(j, 1);
                    this.updateLandersDestroyed();
                    return;  // Exit after collision
                }
            }

            // Remove laser if it goes too far
            if (BABYLON.Vector3.Distance(laser.position, this.camera.position) > 500) {
                laser.dispose();
                this.lasers.splice(i, 1);
            }
        }
    }

    spawnLander() {
        if (!this.scene || !this.astronauts) return;
        
        // Random position on right side of screen
        const x = 400; // Start from right side
        const z = Math.random() * 800 - 400; // Random Z position
        const position = new BABYLON.Vector3(x, 0, z);
        
        // Create new lander
        const lander = new Lander(this.scene, position, this.astronauts);
        if (lander && lander.mesh) {
            this.landers.push(lander);
        }
    }

    updateLanders() {
        for (let i = this.landers.length - 1; i >= 0; i--) {
            const lander = this.landers[i];
            lander.update(this.gamePlane.position.z);

            // Check for collisions with player
            const distanceToPlayer = BABYLON.Vector3.Distance(
                lander.mesh.position,
                this.camera.position
            );
            if (distanceToPlayer < 3) {
                this.takeDamage(20);
                lander.dispose();
                this.landers.splice(i, 1);
                continue;
            }

            // Check for collisions with astronauts
            for (let j = this.astronauts.length - 1; j >= 0; j--) {
                const astronaut = this.astronauts[j];
                if (lander.mesh.intersectsMesh(astronaut, false)) {
                    // Remove both lander and astronaut
                    lander.dispose();
                    this.landers.splice(i, 1);
                    astronaut.dispose();
                    this.astronauts.splice(j, 1);
                    return;  // Exit after collision
                }
            }

            // Remove lander if it goes too far behind
            if (lander.mesh.position.z < -500) {
                lander.dispose();
                this.landers.splice(i, 1);
            }
        }
    }

    createScene() {
        try {
            console.log('Creating scene...');
            // Create the scene space
            const scene = new BABYLON.Scene(this.engine);

            // Initialize arrays first
            console.log('Initializing arrays...');
            this.astronauts = [];
            this.lasers = [];
            this.landers = [];
            this.displays = [];
            this.displayTextures = [];
            this.buttons = [];
            this.warningLights = [];

            console.log('Setting up camera...');
            // Add a camera to the scene (using Universal Camera for FPS-style controls)
            this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 10, -8), scene);
            this.camera.setTarget(new BABYLON.Vector3(0, 2, 0));
            
            // Camera settings for smooth movement
            this.camera.speed = 0.5;
            this.camera.angularSensibility = 1000; // Mouse sensitivity
            this.camera.inertia = 0.5;
            this.camera.rotationQuaternion = new BABYLON.Quaternion();

            // Set camera constraints
            this.camera.minZ = 0.1;
            this.camera.maxZ = 1000;
            
            // Enable camera controls
            this.camera.attachControl(this.canvas, true);
            
            // Customize camera inputs
            this.camera.inputs.clear();
            this.camera.inputs.addMouseWheel();
            this.camera.inputs.addKeyboard();

            console.log('Creating lights...');
            // Add ambient light for general illumination
            const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
            ambientLight.intensity = 0.2;

            // Add directional light to simulate sun
            const sunLight = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-1, -2, 1), scene);
            sunLight.intensity = 0.5;

            console.log('Creating skybox...');
            // Create space skybox
            const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 5000.0 }, scene);
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/textures/space", scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;

            console.log('Creating terrain...');
            // Create lunar terrain
            const terrainMaterial = new BABYLON.StandardMaterial("terrainMaterial", scene);
            terrainMaterial.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/lunar_surface.jpg", scene);
            terrainMaterial.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/lunar_normal.jpg", scene);
            terrainMaterial.diffuseTexture.uScale = 20;
            terrainMaterial.diffuseTexture.vScale = 20;
            terrainMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

            // Create ground with heightmap for terrain
            const ground = BABYLON.MeshBuilder.CreateGround("ground", {
                width: 1000,
                height: 1000,
                subdivisions: 100
            }, scene);
            
            ground.material = terrainMaterial;
            ground.position.y = -2;
            ground.checkCollisions = true;

            // Store the ground plane as a class property
            this.gamePlane = ground;

            console.log('Setting up physics...');
            // Enable physics
            scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
            ground.physicsImpostor = new BABYLON.PhysicsImpostor(
                ground, 
                BABYLON.PhysicsImpostor.HeightmapImpostor, 
                { mass: 0, restitution: 0.9 }, 
                scene
            );

            console.log('Creating mountains...');
            // Create mountains
            this.createMountains(scene, ground);

            console.log('Creating astronauts...');
            // Create astronauts (after ground is created)
            this.createAstronauts(scene);

            console.log('Setting up scene updates...');
            // Add scrolling animation with terrain following
            scene.onBeforeRenderObservable.add(() => {
                if (!this.camera || !this.gamePlane) return;

                // Check ground collision
                const groundHeight = 2; // Fixed height above ground
                if (this.camera.position.y < groundHeight) {
                    this.camera.position.y = groundHeight;
                }

                // Update game objects
                if (this.astronauts && this.astronauts.length > 0) {
                    this.updateAstronauts();
                }
                if (this.landers && this.landers.length > 0) {
                    this.updateLanders();
                }
            });

            console.log('Creating cockpit...');
            // Create cockpit frame
            this.createCockpitFrame(scene);

            // Store the scene
            this.scene = scene;

            console.log('Scene creation completed');
            return scene;

        } catch (error) {
            console.error('Error in createScene:', error);
            throw error;
        }
    }

    createMountains(scene, ground) {
        // Create several mountain ranges
        for (let i = 0; i < 20; i++) {
            const mountainSize = 30 + Math.random() * 50;
            const mountain = BABYLON.MeshBuilder.CreateCylinder(
                `mountain${i}`,
                {
                    height: mountainSize,
                    diameterTop: 0,
                    diameterBottom: mountainSize * 0.8,
                    tessellation: 6 + Math.floor(Math.random() * 6)
                },
                scene
            );

            // Random position on the ground
            const x = (Math.random() - 0.5) * 800;
            const z = (Math.random() - 0.5) * 800;
            const y = ground.getHeightAtCoordinates(x, z);
            mountain.position = new BABYLON.Vector3(x, y, z);

            // Rotate slightly for variety
            mountain.rotation.y = Math.random() * Math.PI;
            mountain.rotation.x = (Math.random() - 0.5) * 0.2;
            mountain.rotation.z = (Math.random() - 0.5) * 0.2;

            // Apply lunar material
            const mountainMaterial = new BABYLON.StandardMaterial(`mountainMat${i}`, scene);
            mountainMaterial.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/lunar_surface.jpg", scene);
            mountainMaterial.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/lunar_normal.jpg", scene);
            mountainMaterial.diffuseTexture.uScale = 5;
            mountainMaterial.diffuseTexture.vScale = 5;
            mountain.material = mountainMaterial;

            // Add collision detection
            mountain.checkCollisions = true;
        }
    }

    createAstronauts(scene) {
        // Create green material for astronauts
        const astronautMaterial = new BABYLON.StandardMaterial("astronautMaterial", scene);
        astronautMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        astronautMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0);
        astronautMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        // Create 10 astronauts
        for (let i = 0; i < 10; i++) {
            // Create sphere for astronaut
            const astronaut = BABYLON.MeshBuilder.CreateSphere(`astronaut${i}`, {
                diameter: 2,
                segments: 16
            }, scene);

            // Random position within the visible area
            const x = Math.random() * 800 - 400; // -400 to 400
            const z = Math.random() * 800 - 400; // -400 to 400
            astronaut.position = new BABYLON.Vector3(x, 0, z);

            // Apply material
            astronaut.material = astronautMaterial;

            // Store initial relative position
            astronaut.initialX = x;
            astronaut.initialZ = z;

            // Add to astronauts array
            this.astronauts.push(astronaut);
        }
    }

    updateAstronauts() {
        // Update each astronaut's position relative to the moving plane
        for (const astronaut of this.astronauts) {
            astronaut.position.z = astronaut.initialZ + this.gamePlane.position.z;
            
            // If astronaut goes too far behind, move it forward
            if (astronaut.position.z < -500) {
                astronaut.position.z += 1000;
                astronaut.initialZ += 1000;
            }
        }
    }

    createCockpitFrame(scene) {
        // Create materials
        const cockpitMaterial = new BABYLON.StandardMaterial("cockpitMaterial", scene);
        cockpitMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        cockpitMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        cockpitMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Create windshield material with transparency and reflection
        const windshieldMaterial = new BABYLON.StandardMaterial("windshieldMaterial", scene);
        windshieldMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.6);
        windshieldMaterial.alpha = 0.3;
        windshieldMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        windshieldMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.3);

        // Create control panel material with emissive texture
        const controlPanelMaterial = new BABYLON.StandardMaterial("controlPanelMaterial", scene);
        controlPanelMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        controlPanelMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);

        // Create main cockpit frame
        const cockpitShape = [
            new BABYLON.Vector3(-2.5, -1.5, -5),
            new BABYLON.Vector3(2.5, -1.5, -5),
            new BABYLON.Vector3(2, 1.5, -5),
            new BABYLON.Vector3(-2, 1.5, -5)
        ];

        const cockpitHull = BABYLON.MeshBuilder.ExtrudePolygon("cockpitHull", {
            shape: cockpitShape,
            depth: 0.1
        }, scene);
        cockpitHull.material = cockpitMaterial;

        // Create windshield
        const windshieldShape = [
            new BABYLON.Vector3(-1.9, -0.8, -4.9),
            new BABYLON.Vector3(1.9, -0.8, -4.9),
            new BABYLON.Vector3(1.5, 1.2, -4.9),
            new BABYLON.Vector3(-1.5, 1.2, -4.9)
        ];

        const windshield = BABYLON.MeshBuilder.ExtrudePolygon("windshield", {
            shape: windshieldShape,
            depth: 0.05
        }, scene);
        windshield.material = windshieldMaterial;

        // Create control panel
        const controlPanel = BABYLON.MeshBuilder.CreateBox("controlPanel", {
            width: 3,
            height: 0.8,
            depth: 0.2
        }, scene);
        controlPanel.position = new BABYLON.Vector3(0, -1.1, -4.8);
        controlPanel.rotation.x = Math.PI / 6; // Tilt the panel up slightly
        controlPanel.material = controlPanelMaterial;

        // Add side panels
        const leftPanel = BABYLON.MeshBuilder.CreateBox("leftPanel", {
            width: 0.5,
            height: 2,
            depth: 0.1
        }, scene);
        leftPanel.position = new BABYLON.Vector3(-2.25, 0, -5);
        leftPanel.material = cockpitMaterial;

        const rightPanel = BABYLON.MeshBuilder.CreateBox("rightPanel", {
            width: 0.5,
            height: 2,
            depth: 0.1
        }, scene);
        rightPanel.position = new BABYLON.Vector3(2.25, 0, -5);
        rightPanel.material = cockpitMaterial;

        // Add control panel details (buttons and displays)
        this.createControlPanelDetails(scene, controlPanel);
    }

    createControlPanelDetails(scene, controlPanel) {
        // Store display references for updating
        this.displays = [];
        this.displayTextures = [];

        // Create button material with glow
        const buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", scene);
        buttonMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.5, 0.7);

        // Create dynamic texture for displays
        for (let i = 0; i < 2; i++) {
            const displayTexture = new BABYLON.DynamicTexture(`displayTexture${i}`, {
                width: 256,
                height: 128
            }, scene, true);
            this.displayTextures.push(displayTexture);

            const displayMaterial = new BABYLON.StandardMaterial(`displayMaterial${i}`, scene);
            displayMaterial.emissiveTexture = displayTexture;
            displayMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.8, 0.2);

            // Create display screen
            const display = BABYLON.MeshBuilder.CreateBox(`display${i}`, {
                width: 0.8,
                height: 0.4,
                depth: 0.05
            }, scene);
            display.position = new BABYLON.Vector3(
                -0.5 + i * 1,
                -0.9,
                -4.7
            );
            display.rotation.x = Math.PI / 6;
            display.material = displayMaterial;
            this.displays.push(display);
        }

        // Add buttons with pulsing glow
        this.buttons = [];
        for (let i = 0; i < 5; i++) {
            const button = BABYLON.MeshBuilder.CreateCylinder(`button${i}`, {
                height: 0.05,
                diameter: 0.1
            }, scene);
            button.position = new BABYLON.Vector3(
                -1 + i * 0.5,
                -1.1,
                -4.7
            );
            
            const buttonMat = buttonMaterial.clone(`buttonMaterial${i}`);
            buttonMat.emissiveColor = new BABYLON.Color3(
                0.3 + Math.random() * 0.4,
                0.3 + Math.random() * 0.4,
                0.3 + Math.random() * 0.4
            );
            button.material = buttonMat;
            this.buttons.push(button);

            // Add pulsing animation to button
            this.createPulsingAnimation(button);
        }

        // Add holographic projector
        const holoProjector = BABYLON.MeshBuilder.CreateCylinder("holoProjector", {
            height: 0.1,
            diameter: 0.3
        }, scene);
        holoProjector.position = new BABYLON.Vector3(0, -0.8, -4.6);
        
        const holoMat = new BABYLON.StandardMaterial("holoMat", scene);
        holoMat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
        holoProjector.material = holoMat;

        // Create hologram effect
        this.createHologramEffect(scene, holoProjector);

        // Add warning lights
        this.warningLights = [];
        const warningPositions = [
            { x: -1.2, y: -0.7, z: -4.6 },
            { x: 1.2, y: -0.7, z: -4.6 }
        ];

        warningPositions.forEach((pos, index) => {
            const light = BABYLON.MeshBuilder.CreateCylinder(`warningLight${index}`, {
                height: 0.05,
                diameter: 0.08
            }, scene);
            light.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            
            const warningMat = new BABYLON.StandardMaterial(`warningMat${index}`, scene);
            warningMat.emissiveColor = new BABYLON.Color3(0.5, 0, 0);
            light.material = warningMat;
            this.warningLights.push(light);
        });
    }

    createPulsingAnimation(button) {
        // Create the animation
        const pulseAnimation = new BABYLON.Animation(
            "pulseAnimation",
            "material.emissiveColor",
            30,
            BABYLON.Animation.ANIMATIONTYPE_COLOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const baseColor = button.material.emissiveColor;
        const keys = [];
        keys.push({
            frame: 0,
            value: baseColor
        });
        keys.push({
            frame: 15,
            value: baseColor.scale(1.5)
        });
        keys.push({
            frame: 30,
            value: baseColor
        });

        pulseAnimation.setKeys(keys);
        button.animations = [pulseAnimation];
        
        // Start animation directly on the scene that owns the button
        const scene = button.getScene();
        scene.beginAnimation(button, 0, 30, true);
    }

    createHologramEffect(scene, projector) {
        // Create hologram cone
        const points = [];
        for (let i = 0; i < 20; i++) {
            points.push(new BABYLON.Vector3(
                0.15 * (i / 19),
                i * 0.1,
                0
            ));
        }

        let hologram = BABYLON.MeshBuilder.CreateLines("hologram", {
            points: points,
            updatable: true
        }, scene);
        
        hologram.position = projector.position.clone();
        hologram.rotation.x = Math.PI / 2;

        const holoMat = new BABYLON.StandardMaterial("holoMat", scene);
        holoMat.emissiveColor = new BABYLON.Color3(0, 0.7, 1);
        holoMat.alpha = 0.5;
        hologram.material = holoMat;

        // Animate hologram
        let angle = 0;
        scene.onBeforeRenderObservable.add(() => {
            angle += 0.05;
            hologram.rotation.y = angle;
            
            // Update points for wave effect
            const newPoints = points.map((p, i) => {
                return new BABYLON.Vector3(
                    0.15 * (i / 19) * Math.sin(angle + i * 0.2),
                    i * 0.1,
                    0.15 * (i / 19) * Math.cos(angle + i * 0.2)
                );
            });
            
            hologram = BABYLON.MeshBuilder.CreateLines("hologram", {
                points: newPoints,
                instance: hologram
            });
        });
    }

    initializeDisplayUpdates() {
        console.log('Setting up display update intervals...');
        
        // Update displays every second
        this.displayUpdateInterval = setInterval(() => {
            if (this.isRunning && !this.isGameOver) {
                this.updateDisplays();
            }
        }, 1000);

        // Update warning lights every 500ms
        this.warningUpdateInterval = setInterval(() => {
            if (this.isRunning && !this.isGameOver) {
                this.updateWarningLights();
            }
        }, 500);

        console.log('Display update intervals set');
    }

    updateDisplays() {
        if (!this.scene || !this.displayTextures) return;

        // Update left display with targeting info
        const ctx0 = this.displayTextures[0].getContext();
        ctx0.clearRect(0, 0, 256, 128);
        
        // Draw radar background
        ctx0.fillStyle = "rgba(0, 20, 0, 0.3)";
        ctx0.fillRect(0, 0, 256, 128);
        
        // Draw radar grid
        ctx0.strokeStyle = "rgba(0, 255, 0, 0.2)";
        for (let i = 0; i < 256; i += 32) {
            ctx0.beginPath();
            ctx0.moveTo(i, 0);
            ctx0.lineTo(i, 128);
            ctx0.stroke();
        }
        for (let i = 0; i < 128; i += 32) {
            ctx0.beginPath();
            ctx0.moveTo(0, i);
            ctx0.lineTo(256, i);
            ctx0.stroke();
        }

        // Draw radar sweep
        const time = Date.now() * 0.001;
        const sweepAngle = (time % 2) * Math.PI;
        ctx0.strokeStyle = "rgba(0, 255, 0, 0.5)";
        ctx0.beginPath();
        ctx0.moveTo(128, 64);
        ctx0.lineTo(
            128 + Math.cos(sweepAngle) * 128,
            64 + Math.sin(sweepAngle) * 64
        );
        ctx0.stroke();

        // Draw enemy blips
        this.landers.forEach(lander => {
            const relativeX = (lander.mesh.position.x - this.camera.position.x) / 2;
            const relativeZ = (lander.mesh.position.z - this.camera.position.z) / 2;
            const blipX = 128 + relativeX;
            const blipY = 64 + relativeZ;
            
            if (blipX >= 0 && blipX <= 256 && blipY >= 0 && blipY <= 128) {
                ctx0.fillStyle = "red";
                ctx0.beginPath();
                ctx0.arc(blipX, blipY, 3, 0, Math.PI * 2);
                ctx0.fill();
            }
        });

        // Draw astronaut blips
        this.astronauts.forEach(astronaut => {
            const relativeX = (astronaut.position.x - this.camera.position.x) / 2;
            const relativeZ = (astronaut.position.z - this.camera.position.z) / 2;
            const blipX = 128 + relativeX;
            const blipY = 64 + relativeZ;
            
            if (blipX >= 0 && blipX <= 256 && blipY >= 0 && blipY <= 128) {
                ctx0.fillStyle = "green";
                ctx0.beginPath();
                ctx0.arc(blipX, blipY, 2, 0, Math.PI * 2);
                ctx0.fill();
            }
        });

        // Draw HUD information
        ctx0.fillStyle = "lime";
        ctx0.font = "12px monospace";
        ctx0.fillText(`RADAR RANGE: 200m`, 10, 15);
        
        // Draw targeting data
        const closestDistance = this.getClosestLanderDistance();
        ctx0.fillStyle = closestDistance < 20 ? "red" : "lime";
        ctx0.fillText(`NEAREST THREAT: ${Math.floor(closestDistance)}m`, 10, 30);
        ctx0.fillStyle = "lime";
        ctx0.fillText(`ACTIVE THREATS: ${this.landers.length}`, 10, 45);
        
        // Draw energy status with warning
        const energyPercent = Math.floor(this.energy);
        ctx0.fillStyle = energyPercent < 30 ? "red" : "lime";
        ctx0.fillText(`ENERGY: ${energyPercent}%`, 10, 60);
        if (energyPercent < 30) {
            if (Math.sin(Date.now() * 0.01) > 0) {
                ctx0.fillText("LOW ENERGY WARNING", 10, 75);
            }
        }

        this.displayTextures[0].update();

        // Update right display with mission stats and system status
        const ctx1 = this.displayTextures[1].getContext();
        ctx1.clearRect(0, 0, 256, 128);
        
        // Draw system status background
        ctx1.fillStyle = "rgba(0, 20, 0, 0.3)";
        ctx1.fillRect(0, 0, 256, 128);

        // Draw header
        ctx1.fillStyle = "lime";
        ctx1.font = "14px monospace";
        ctx1.fillText("MISSION STATUS", 10, 20);
        
        // Draw separator line
        ctx1.strokeStyle = "rgba(0, 255, 0, 0.5)";
        ctx1.beginPath();
        ctx1.moveTo(10, 25);
        ctx1.lineTo(246, 25);
        ctx1.stroke();

        // Draw mission stats with dynamic formatting
        ctx1.font = "12px monospace";
        ctx1.fillText(`SCORE: ${this.score}`, 10, 45);
        ctx1.fillText(`ASTRONAUTS SAVED: ${this.astronautsSaved}`, 10, 60);
        ctx1.fillText(`HOSTILES ELIMINATED: ${this.landersDestroyed}`, 10, 75);
        
        // Draw hull integrity
        const hullPercent = Math.floor((this.health / this.maxHealth) * 100);
        ctx1.fillStyle = hullPercent < 30 ? "red" : "lime";
        ctx1.fillText(`HULL INTEGRITY: ${hullPercent}%`, 10, 90);
        
        // Draw warning messages
        if (hullPercent < 30) {
            if (Math.sin(Date.now() * 0.01) > 0) {
                ctx1.fillStyle = "red";
                ctx1.fillText("WARNING: HULL CRITICAL", 10, 105);
            }
        }

        // Draw mission time
        const missionTime = Math.floor((Date.now() - this.startTime) / 1000);
        ctx1.fillStyle = "lime";
        ctx1.fillText(`MISSION TIME: ${Math.floor(missionTime / 60)}:${(missionTime % 60).toString().padStart(2, '0')}`, 10, 120);

        this.displayTextures[1].update();
    }

    getClosestLanderDistance() {
        if (this.landers.length === 0) return 0;
        
        let closestDistance = Infinity;
        for (const lander of this.landers) {
            const distance = BABYLON.Vector3.Distance(
                this.camera.position,
                lander.mesh.position
            );
            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }
        return closestDistance;
    }

    // Add game state management
    start() {
        console.log('Starting game...');
        try {
            // Make sure everything is initialized
            if (!this.scene || !this.camera || !this.engine) {
                throw new Error('Game not properly initialized');
            }

            // Initialize game state
            this.isRunning = true;
            this.isGameOver = false;
            this.startTime = Date.now();

            // Start the render loop if it's not already running
            if (!this.engine.isRunning) {
                this.engine.runRenderLoop(() => {
                    if (this.scene && this.isRunning) {
                        this.scene.render();
                    }
                });
            }

            console.log('Game started successfully');
        } catch (error) {
            console.error('Error starting game:', error);
            throw error;
        }
    }

    pause() {
        this.isRunning = false;
        console.log("Game paused!");
    }

    resume() {
        this.isRunning = true;
        console.log("Game resumed!");
    }

    showGameOver() {
        const gameOverScreen = new BABYLON.GUI.Rectangle();
        gameOverScreen.width = "400px";
        gameOverScreen.height = "300px";
        gameOverScreen.cornerRadius = 20;
        gameOverScreen.color = "white";
        gameOverScreen.thickness = 2;
        gameOverScreen.background = "black";
        this.guiTexture.addControl(gameOverScreen);

        const gameOverText = new BABYLON.GUI.TextBlock();
        gameOverText.text = "GAME OVER\n\n" +
            `Final Score: ${this.score}\n` +
            `Astronauts Saved: ${this.astronautsSaved}\n` +
            `Landers Destroyed: ${this.landersDestroyed}`;
        gameOverText.color = "white";
        gameOverText.fontSize = 24;
        gameOverScreen.addControl(gameOverText);

        const restartButton = BABYLON.GUI.Button.CreateSimpleButton("restart", "Play Again");
        restartButton.width = "150px";
        restartButton.height = "40px";
        restartButton.color = "white";
        restartButton.cornerRadius = 20;
        restartButton.background = "green";
        restartButton.top = "80px";
        restartButton.onPointerUpObservable.add(() => {
            window.location.reload();
        });
        gameOverScreen.addControl(restartButton);
    }

    createScoringEffect(points, position) {
        const scorePopup = new BABYLON.GUI.TextBlock();
        scorePopup.text = `+${points}`;
        scorePopup.color = points >= 100 ? "green" : "yellow";
        scorePopup.fontSize = 20;
        scorePopup.animations = [];

        // Position animation
        const positionAnimation = new BABYLON.Animation(
            "positionAnimation",
            "top",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const positionKeys = [];
        positionKeys.push({ frame: 0, value: position.y });
        positionKeys.push({ frame: 30, value: position.y - 50 });
        positionAnimation.setKeys(positionKeys);

        // Opacity animation
        const opacityAnimation = new BABYLON.Animation(
            "opacityAnimation",
            "alpha",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const opacityKeys = [];
        opacityKeys.push({ frame: 0, value: 1 });
        opacityKeys.push({ frame: 30, value: 0 });
        opacityAnimation.setKeys(opacityKeys);

        scorePopup.animations.push(positionAnimation);
        scorePopup.animations.push(opacityAnimation);

        this.guiTexture.addControl(scorePopup);

        this.scene.beginAnimation(scorePopup, 0, 30, false, 1, () => {
            scorePopup.dispose();
        });
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealthBar();

        if (this.health <= 0 && !this.isGameOver) {
            this.isGameOver = true;
            this.showGameOver();
        }
    }

    updateHealthBar() {
        if (!this.healthBar) return;
        this.healthBar.width = (this.health / this.maxHealth * 100) + "%";
        if (this.health < 30) {
            this.healthBar.background = "darkred";
        }
    }

    updateEnergyBar() {
        if (!this.energyBar) return;
        this.energyBar.width = (this.energy / this.maxEnergy * 100) + "%";
    }

    updateWarningLights() {
        if (this.health < 30 || this.energy < 30) {
            const intensity = (Math.sin(Date.now() * 0.01) + 1) / 2;
            this.warningLights.forEach(light => {
                light.material.emissiveColor = new BABYLON.Color3(intensity, 0, 0);
            });
        } else {
            this.warningLights.forEach(light => {
                light.material.emissiveColor = new BABYLON.Color3(0.1, 0, 0);
            });
        }
    }

    update() {
        if (!this.isRunning || this.isGameOver) return;

        const currentTime = Date.now();
        
        try {
            // Spawn new lander if it's time
            if (currentTime - this.lastLanderSpawn > this.landerSpawnInterval) {
                this.spawnLander();
                this.lastLanderSpawn = currentTime;
            }

            // Update energy
            if (this.energy < this.maxEnergy) {
                this.energy = Math.min(this.maxEnergy, this.energy + this.energyRechargeRate);
                this.updateEnergyBar();
            }

            // Update game objects
            this.updateLasers();
            this.updateLanders();
            this.updateAstronauts();

            // Check for collisions
            this.checkCollisions();

            // Update game difficulty
            this.updateDifficulty();

        } catch (error) {
            console.error('Error in game update loop:', error);
            this.isRunning = false;
        }
    }

    updateLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            if (laser.position.y > 1000 || laser.position.y < -1000) {
                laser.dispose();
                this.lasers.splice(i, 1);
            }
        }
    }

    updateLanders() {
        for (let i = this.landers.length - 1; i >= 0; i--) {
            const lander = this.landers[i];
            
            // Move lander down
            lander.position.y -= this.gameSpeed * 0.5;

            // Remove if out of bounds
            if (lander.position.y < -100) {
                lander.dispose();
                this.landers.splice(i, 1);
            }
        }
    }

    updateAstronauts() {
        for (let i = this.astronauts.length - 1; i >= 0; i--) {
            const astronaut = this.astronauts[i];
            
            // Apply gravity
            astronaut.position.y -= this.gameSpeed * 0.3;

            // Remove if out of bounds
            if (astronaut.position.y < -100) {
                astronaut.dispose();
                this.astronauts.splice(i, 1);
                this.updateScore(-50); // Penalty for lost astronaut
            }
        }
    }

    updateDifficulty() {
        const timePlayed = (Date.now() - this.startTime) / 1000; // Time in seconds
        
        // Increase difficulty every 30 seconds
        this.difficulty = Math.min(10, 1 + Math.floor(timePlayed / 30));
        
        // Adjust game parameters based on difficulty
        this.gameSpeed = 1 + (this.difficulty * 0.1);
        this.landerSpawnInterval = Math.max(1000, 3000 - (this.difficulty * 200));
        this.maxEnemies = 5 + Math.floor(this.difficulty / 2);
    }

    checkCollisions() {
        // Check laser collisions with landers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            for (let j = this.landers.length - 1; j >= 0; j--) {
                const lander = this.landers[j];
                
                if (this.checkObjectCollision(laser, lander)) {
                    // Create explosion effect
                    this.createExplosion(lander.position);
                    
                    // Remove both objects
                    laser.dispose();
                    lander.dispose();
                    this.lasers.splice(i, 1);
                    this.landers.splice(j, 1);
                    
                    // Update score
                    this.updateScore(100);
                    break;
                }
            }
        }
    }

    checkObjectCollision(obj1, obj2) {
        const distance = BABYLON.Vector3.Distance(obj1.position, obj2.position);
        return distance < 2; // Collision threshold
    }

    createExplosion(position) {
        // Create particle system for explosion
        const explosion = new BABYLON.ParticleSystem("explosion", 100, this.scene);
        explosion.particleTexture = new BABYLON.Texture("textures/flare.png", this.scene);
        explosion.emitter = position;
        explosion.minEmitBox = new BABYLON.Vector3(-0.5, -0.5, -0.5);
        explosion.maxEmitBox = new BABYLON.Vector3(0.5, 0.5, 0.5);
        explosion.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
        explosion.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
        explosion.minSize = 0.3;
        explosion.maxSize = 0.8;
        explosion.minLifeTime = 0.3;
        explosion.maxLifeTime = 0.5;
        explosion.emitRate = 100;
        explosion.gravity = new BABYLON.Vector3(0, 0, 0);
        explosion.direction1 = new BABYLON.Vector3(-1, -1, -1);
        explosion.direction2 = new BABYLON.Vector3(1, 1, 1);
        explosion.minEmitPower = 1;
        explosion.maxEmitPower = 3;
        explosion.updateSpeed = 0.01;

        // Start the particle system
        explosion.start();

        // Stop and dispose after animation
        setTimeout(() => {
            explosion.stop();
            setTimeout(() => {
                explosion.dispose();
            }, 1000);
        }, 300);
    }
} 