import board1Tex from '../assets/sheets/board1.png';
import board1Atlas from '../assets/sheets/board1.json';
import commonTex from '../assets/sheets/common.png';
import commonAtlas from '../assets/sheets/common.json';
import levelBg from '../assets/embed/background/default.png';

class BootScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'BootScene'
        });
    }


    preload() {
        console.log("BootScene Preload");
        const progress = this.add.graphics();

        // Register a load progress event to show a load bar
        this.load.on('progress', (value) => {
            progress.clear();
            progress.fillStyle(0xffffff, 1);
            progress.fillRect(0, this.game.config.height / 2, this.game.config.width * value, 60);
        });

        // Register a load complete event to launch the title screen when all files are loaded
        this.load.on('complete', () => {
            // prepare all animations, defined in a separate file
            // makeAnimations(this);
            progress.destroy();
            console.log("loaded! ");
            this.scene.start('GameScene');
        });

        this.load.image('levelBg', levelBg);
        this.load.atlas('board1', board1Tex, board1Atlas);
        this.load.atlas('common', commonTex, commonAtlas);
    }
}

export default BootScene;
