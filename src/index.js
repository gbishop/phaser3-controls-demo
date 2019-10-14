import phaser from 'phaser';
import { Preloader } from './scenes/preloader';
import { Game } from './scenes/game';
import { Control } from './scenes/control';

const config = {
    type: phaser.AUTO,
    //width: 270,
    //height: 480,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'content',
    scene: [
        Preloader,
        Game,
        Control
    ]
}

const game =  new phaser.Game(config);

window.onresize = function(){
    game.scale.resize(window.innerWidth, window.innerHeight);
    game.events.emit('resize');
}
