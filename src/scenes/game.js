import { Scene } from 'phaser'

export class Game extends Scene {
    constructor () {
        super({
            key: 'game',
            physics: {
                default: 'arcade',
                arcade: {
                    debug:false,
                    //gravity:0
                }
            }
        })

        this.staticBg = null;
        this.scrollingBg = null;
        this.rocket = null;
        this.alien = null;

        this.alienTargetY = this.norm_Y;
        this.canUpdateAlien = false;
        this.isRocketResetting = false;
        this.isGameOver = false;

        this.alienSpeed = 0;

        this.scrollSpeed = 0;
        this.particles = null;
        this.emitter = null;
        this.topSpikes = null;
        this.bottomSpikes = null;
        this.cameraRect = null;
        console.log('Game constructor');

        this.norm_X = 0; //set the normal X position centering
        this.norm_Y = 0; //set the normal Y position centering

        this.start_rocket_Y = this.norm_Y + 140;
        this.start_alien_Y = this.norm_Y - 300; //outside of screen

        this.rocket_die_up = false;
        this.readyLaunch = true;
    }

    create(){
        // Add the static square bg first at 0,0 position
        this.staticBg = this.add.image(this.norm_X, this.norm_Y,'bg-static');
        // Apply a grey tint to it
        this.staticBg.setTint(0x444444);
        this.staticBg.setOrigin(0.5, 0.5); //default Origin is 0.5, value 0-1, setOrigin(x, y);
        // Add a tilesprite so the striped image(396x529) can be scrolled indefinitely
        this.scrollingBg = this.add.tileSprite(this.norm_X,this.norm_Y,396,529,'bg-overlay');
        this.scrollingBg.setOrigin(0.5, 0.5);

        this.topSpikes = this.add.sprite(this.norm_X, this.norm_Y - 240, 'spike');
        this.topSpikes.setOrigin(0.5, 0.5);
        this.topSpikes.flipY = true;
        this.bottomSpikes = this.add.sprite(this.norm_X, this.norm_Y + 240, 'spike');
        this.bottomSpikes.setOrigin(0.5, 0.5);
        this.cameraRect = this.add.zone(0, 0, 0, 0);

        // Add a listener to our resize event
        this.sys.game.events.on('resize', this.resize, this)
        // Call the resize so the game resizes correctly on scene start
        this.resize()
        // Listen for this scene exit
        this.events.once('shutdown', this.shutdown, this)
        console.log('dibuat game create');

        this.rocket = this.add.sprite(this.norm_X, (this.start_rocket_Y), 'rocket');
        this.alien = this.add.sprite(this.norm_X, (this.start_alien_Y), 'alien');

        // Enable physics on rocket and alien sprites
        this.physics.world.enable([this.rocket, this.alien, this.topSpikes, this.bottomSpikes]);
        this.topSpikes.body.immovable = true;
        this.bottomSpikes.body.immovable = true;

        // Reset alien so it will spawn from the top and start moving
        this.resetAlien();

        this.particles = this.add.particles('particle');
        this.emitter = this.particles.createEmitter({
            angle: { min: 0, max: 360 },
            speed: { min: 50, max: 200 },
            quantity: { min: 40, max: 50 },
            lifespan: { min: 200, max: 500},
            alpha: { start: 1, end: 0 },
            scale: { min: 0.5, max: 0.5 },
            rotate: { start: 0, end: 360 },
            gravityY: 800,
            on: false
        });

        // Listen for pointerdown event and launch the rocket
        this.input.on('pointerdown', this.launchRocket, this);
    }

    resize () {
        console.log('resize game');

        //I don't know why the camera code not work like in the tutorial,
        //So I made some change to make the view right.

        // We can add multiple cameras in a Phaser 3 scene
        // This is how we get the main camera
        let cam = this.cameras.main;
        // Set its viewport as same as our game dimension
        //cam.setViewport(0,0,270,480);
        cam.setViewport(0,0,window.innerWidth, window.innerHeight);
        // Center align the camera to occupy all our game objects
        cam.centerToBounds();
        cam.setScroll(-window.innerWidth/2 + this.norm_X, -window.innerHeight/2 + this.norm_Y);
        // Adjust the zoom such that it scales the game
        // just enough to clear out the black areas
        // cam.zoom = Math.max(window.innerWidth/270, window.innerHeight/480);
        // If we want to fit our game inside, then use the min scale
        cam.zoom = Math.min(window.innerWidth/270, window.innerHeight/480)
        
        /*this.cameraRect.x = cam.x;
        this.cameraRect.y = cam.y;
        this.cameraRect.width = cam.width/cam.zoom;
        this.cameraRect.height = cam.height/cam.zoom;

        Phaser.Display.Align.In.TopCenter(this.topSpikes, this.cameraRect);
        Phaser.Display.Align.In.BottomCenter(this.bottomSpikes, this.cameraRect);*/
    }

    update(time, delta){
        //console.log('dibuat game update');
        if(this.canUpdateAlien){
            this.moveAlien(time, delta);

            // Listen for overlapping between rocket and alien and call rocketCollideWithAlien when an overlap occurs
            this.physics.add.overlap(this.rocket, this.alien, this.rocketCollideWithALien, null, this);
        }

        if(!this.isGameOver){
            this.physics.add.overlap(this.rocket, this.topSpikes, this.rocketCollidedWithSpike, null, this);
            this.physics.add.overlap(this.rocket, this.bottomSpikes, this.rocketCollidedWithSpike, null, this);
            //this.checkRocketOutOfBound();
            this.scrollingBg.tilePositionY -= 1;
            this.rocket.y += 0.5;
        }

        if(this.isRocketResetting){
            if(this.rocket_die_up){
                // Scroll the bg down
                this.scrollingBg.tilePositionY -= delta;    
                // Move rocket down
                this.rocket.y += delta;

                if(this.rocket.y >= this.start_rocket_Y){
                    this.rocket.y = this.start_rocket_Y;
                    this.isRocketResetting = false;
    
                    // After movement reset alien so the next alien comes
                    this.resetAlien();
                    this.readyLaunch = true;
                    if(this.isGameOver){
                        this.resetGame();
                    }
                }
            }else{
                // Scroll the bg up
                this.scrollingBg.tilePositionY += delta;
                // Move rocket up
                this.rocket.y -= delta;

                if(this.rocket.y < this.start_rocket_Y){
                    this.rocket.y = this.start_rocket_Y;
                    this.isRocketResetting = false;
    
                    // After movement reset alien so the next alien comes
                    this.resetAlien();
                    this.readyLaunch = true;
                    if(this.isGameOver){
                        this.resetGame();
                    }
                }
            }
        }
    }

    resetAlien(){
        this.canUpdateAlien = true;
        this.alien.x = this.norm_X;
        this.alien.y = this.start_alien_Y;
        this.alienTargetY = this.norm_Y + Phaser.Math.Between(-150, 0); //reset random alien position
        this.alienSpeed = Phaser.Math.Between(5, 10) * 0.001; //reset random alien speed
    }

    moveAlien(time, delta){
        // Moves the alien down to this.alienTargetY position
        this.alien.y += (this.alienTargetY - this.alien.y) * 0.3;

        // Moves the horizontal position back and forth
        // Multiplying the time to reduce the movement speed
        // 90 is the maximum horizontal amount to move
        this.alien.x = this.norm_X + Math.sin(time * this.alienSpeed) * 90;
    }

    launchRocket(){
        // readyLaunch used to hold up pressing repeatedly
        if(this.readyLaunch && !this.isGameOver){ 
            this.readyLaunch = false;
            // Launching means decrease the y velocity
            this.rocket.body.setVelocity(0, -2000);
        }
    }

    checkRocketOutOfBound(){
        if(this.rocket.y <= -50 || this.rocket.y >= 500){
            console.log('game over');
            this.isGameOver = true;

            if(this.rocket.y <= -50){
                this.rocket_die_up = true;
            }else{
                this.rocket_die_up = false;
            }

            this.cameras.main.shake(100, 0.01, 0.01);
            
            this.canUpdateAlien = false;
            this.rocket.body.setVelocity(0);
            this.alien.y = this.start_alien_Y;
            this.time.delayedCall(500, this.resetRocket, [], this);
        }
    }

    rocketCollideWithALien(rocket, alien){
        if(!this.canUpdateAlien){ //Overlap runs multiple frames, we only want it to run once
            return;
        }

        // Stop updating alien movement
        this.canUpdateAlien = false;

        // Stop moving the rocket
        this.rocket.body.setVelocity(0);
        this.rocket_die_up = true;

        this.particles.emitParticleAt(this.alien.x, this.alien.y);

        //Move the alien out of our screen for now
        this.alien.y = this.start_alien_Y;

        this.cameras.main.shake(100, 0.01, 0.01); // Duration, intensity, force

        this.time.delayedCall(200, this.resetRocket, [], this);
    }

    rocketCollidedWithSpike (rocket, spike) {
        if (this.isGameOver) {
            return;
        }
        this.canUpdateAlien = false;
        this.isGameOver = true;
        if(spike == this.topSpikes){
            this.rocket_die_up = true;
        }else{
            this.rocket_die_up = false;
        }

        this.rocket.body.setVelocity(0);
        this.particles.emitParticleAt(this.rocket.x, this.rocket.y);
        this.cameras.main.shake(100, 0.01, 0.01);

        this.alien.y = this.start_alien_Y;
        this.time.delayedCall(500, this.resetRocket, [], this);
        //this.alien.destroy();
        //this.rocket.destroy();
    }

    resetRocket(){
        this.isRocketResetting = true;
    }

    resetGame(){
        this.isGameOver = false;
    }

    shutdown () {
        console.log('shutdown game');
        // When this scene exits, remove the resize handler
        this.sys.game.events.off('resize', this.resize, this)
        // When this scene exits, remove the pointerdown handler
        this.input.off('pointerdown', this.launchRocket, this);
    }
}