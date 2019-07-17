import Phaser from "phaser";
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import Server from './components/Server';



const config1 = {
    type: Phaser.AUTO,
    scale: {
        width: 1080,
        height: 1920,
        parent: 'content1',
        mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH
    },
    scene: [
        BootScene,
        GameScene
    ]
};

const config2 = {
    type: Phaser.AUTO,
    scale: {
        width: 1080,
        height: 1920,
        parent: 'content2',
        mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH
    },
    scene: [
        BootScene,
        GameScene
    ]
};

global.randomNames = ['Maria','Suzanna','Stella','Sofia','John','Mike','Jim','Peter'];

global.server = new Server();

const game1 = new Phaser.Game(config1);
const game2 = new Phaser.Game(config2);

