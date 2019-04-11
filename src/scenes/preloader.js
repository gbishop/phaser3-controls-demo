import { Scene } from 'phaser'
import img_bg_static from '../assets/square-150x150.png';
import img_bg_overlay from '../assets/bg-150x150.png';
import img_rocket from '../assets/rocket.png';
import img_alien from '../assets/alien.png';
import img_particle from '../assets/particle.png';
import img_spike from '../assets/spike.png';

export class Preloader extends Scene {
    constructor () {
        super({
            key: 'preloader'
        })
        console.log('Preloader constructor');
    }

    preload(){
        console.log('Preloader preload');
        
        this.load.image('bg-static', img_bg_static);
        this.load.image('bg-overlay', img_bg_overlay);
        this.load.image('rocket', img_rocket);
        this.load.image('alien', img_alien);
        this.load.image('particle', img_particle);
        this.load.image('spike', img_spike);

        console.log('Preloader finish');
    }

    create(){
        this.scene.start('game');
    }
}