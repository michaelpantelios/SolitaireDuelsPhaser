class SolitaireCard extends Phaser.GameObjects.Container {
    constructor(config){
        super(config.scene, config.x, config.y, [] );
        config.scene.add.existing(this);
        this.config = config;
        this.scaleFactor = 1.5;
        this.setSize(SolitaireCard.prototype.CARD_WIDTH, SolitaireCard.prototype.CARD_HEIGHT);

        this.cardVal = config.cardVal;
        this.faceDown = config.faceDown;
        this.frozen = false;

        const frontSide = new Phaser.GameObjects.Image(config.scene, 0, 0, 'common', 'cards/face');
        frontSide.setScale( this.scaleFactor,  this.scaleFactor);
        this.add(frontSide);
        this.setData('frontSide', frontSide);

        if (this.cardVal != -1){
            var color =  Math.random() > 0.5 ? 'black' : 'red';
            var cardValCornerTexPath =   'cards/'+ color + '/'+this.getRankString(this.cardVal);
            var cardValCenterTexPath =  cardValCornerTexPath+"C";

            const cornerVal = new Phaser.GameObjects.Image(config.scene, -frontSide.width*0.55, -frontSide.height*0.55, 'common', cardValCornerTexPath);
            // cornerVal.setScale( this.scaleFactor, this.scaleFactor);
            this.add(cornerVal);

            const centerVal = new Phaser.GameObjects.Image(config.scene, 0,0, 'common', cardValCenterTexPath);
            this.add(centerVal);
        } else {
            const centerVal = new Phaser.GameObjects.Image(config.scene, 0,0, 'board1', 'joker');
            this.add(centerVal);
        }

        const backSide = new Phaser.GameObjects.Image(config.scene, 0, 0, 'board1', 'cardBack');
        backSide.setScale(this.scaleFactor, this.scaleFactor);
        backSide.visible = this.faceDown;
        this.add(backSide);
        this.backSide = backSide;
    }

    setCardVal(_cardVal){
        this.cardVal = _cardVal;
    }

    setFaceDown(_faceDown, animate = false){
      this.faceDown = _faceDown;
      if (!animate)
        this.backSide.visible = _faceDown;
      else {
          this.config.scene.tweens.add({
             targets : this,
              scaleX : 0.0,
              skewY: 0.65,
             duration: SolitaireCard.turnDuration*0.5,
              onComplete : () =>{ this.onHalfTurn(this) }
          });
      }


    }

    onHalfTurn(card){
        this.config.scene.tweens.add({
            targets : this,
            scaleX : 1.0,
            skewY: 0.0,
            duration: SolitaireCard.turnDuration*0.5,
            onStart : () =>{ this.backSide.visible =  this.faceDown;}
        });
    }

    getCardVal(){
        return this.cardVal;
    }

    getFaceDown(){
        return this.faceDown;
    }

    set Frozen(val){
        this.frozen = val;
    }

    get Frozen(){
        return this.frozen;
    }

    getRankString(rank){
        var rankString;
        switch (rank)
        {
            case 13:
                return "K";
            case 12:
                return "Q";
            case 11:
                return "J";
            case 10:
                return "T";
            case 1:
                return "A";
            default:
                return String(rank);
        }

        return rankString;
    }
}

export default SolitaireCard;

SolitaireCard.prototype.CARD_WIDTH = 85*1.5;
SolitaireCard.prototype.CARD_HEIGHT= 113*1.5;
SolitaireCard.turnDuration = 200;
