class PlayerBox extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y, []);
        config.scene.add.existing(this);

        this.pos = -1;
        this.points = 0;
        this.cardsLeft = 0;

        const bg = new Phaser.GameObjects.Image(config.scene,0,0, 'board1', 'userBox');
        bg.setOrigin(0.5,0);
        bg.scaleX = 1.5;
        bg.scaleY = 1.5;
        this.add(bg);

        this.setSize(bg.displayWidth, bg.displayHeight);

        var usernameText = new Phaser.GameObjects.Text(config.scene, 0, 0, 'USERNAME', {})
        usernameText.setStyle({
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        usernameText.x = -bg.displayWidth*0.5 + 30;
        usernameText.y = 10;
        usernameText.name = 'usernameText';
        this.add(usernameText);

        var cardsLeftText = new Phaser.GameObjects.Text(config.scene, 0,0, '99', {});
        cardsLeftText.setStyle({
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#aaffff',
            align: 'center'
        });
        cardsLeftText.x = bg.displayWidth*0.5 - cardsLeftText.width-30;
        cardsLeftText.y = cardsLeftText.height*0.25;
        cardsLeftText.name = 'cardsLeftText';
        this.add(cardsLeftText);

        var pointsText = new Phaser.GameObjects.Text(config.scene, 0,0, '1000', {});
        pointsText.setStyle({
            fontSize: '30px',
            fontFamily:'Arial',
            color: '#ffaaff',
            align: 'center'
        });
        pointsText.x = usernameText.x;
        pointsText.y = bg.displayHeight*0.4;
        pointsText.name = 'pointsText';
        this.add(pointsText);

        var iceBarHolder = new Phaser.GameObjects.Image(config.scene, 0,0, 'board1', 'iceBarEmpty');
        iceBarHolder.setOrigin(0, 0);
        iceBarHolder.scaleX = iceBarHolder.scaleY = 1.5;
        iceBarHolder.x = -iceBarHolder.displayWidth*0.5;
        iceBarHolder.y = bg.displayHeight*0.65;
        this.add(iceBarHolder);

        const iceBar = new Phaser.GameObjects.Image(config.scene, 0, 0, 'board1', 'iceBarFull');
        iceBar.setOrigin(0, 0);
        iceBar.scaleX = iceBar.scaleY = 1.5;
        iceBar.x = iceBarHolder.x;
        iceBar.y = iceBarHolder.y;
        this.add(iceBar);
        this.iceBar = iceBar;

        const iceBarMask = config.scene.add.graphics();
        iceBarMask.parentContainer = this;
        iceBarMask.fillStyle(0xff0000, 1);
        iceBarMask.fillRect(0, 0, iceBar.displayWidth, iceBar.displayHeight);
        iceBarMask.x = this.x + iceBar.x;
        iceBarMask.y = this.y + iceBar.y;
        var mask = iceBarMask.createGeometryMask();
        iceBarMask.setVisible(false);
        iceBar.mask = mask;
        this.iceBarMask = iceBarMask;
    }

    Init(playerState, cardsLeft){
        this.getByName('usernameText').text = playerState.playerName;
        this.pos = playerState.pos;

        this.iceBarMask.clear();
        this.iceBarMask.fillRect(0,0, this.iceBar.displayWidth*0, this.iceBar.displayHeight);

        this.points = playerState.score;
        this.cardsLeft = cardsLeft;

        this.updateBox();
    }

    Sync(){

        this.updateBox();
    }

    updateBox(){
         this.getByName('cardsLeftText').text = this.cardsLeft;
         this.getByName('pointsText').text = this.points;
    }
}

export default PlayerBox;
