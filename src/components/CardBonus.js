class CardBonus extends Phaser.GameObjects.Container {
    constructor(config){
        super(config.scene, config.x, config.y, [] );
        config.scene.add.existing(this);
        this.config = config;
        this.scaleFactor = 1.5;

        var bonusTex = "";

        switch (this.config.bonusType){
            case CardBonus.prototype.BONUS_EXTRA_CARDS:
                bonusTex = "extraCardsBonus";
                break;
            case CardBonus.prototype.BONUS_CARD_REVEAL:
                bonusTex = "cardsFlipBonus";
                break;
        }
        const bonusImage = new Phaser.GameObjects.Image(this.config.scene, 0, 0, 'board1', bonusTex);
        bonusImage.setScale( this.scaleFactor,  this.scaleFactor);
        this.add(bonusImage);

        var bonusTime = new Phaser.GameObjects.Text(config.scene, 0,0,'30', {});
        bonusTime.setStyle({
            fontSize: '45px',
            fontFamily: 'Arial',
            color: '#e26b30',
            align: 'center'
        });
        bonusTime.setOrigin(-0.05,1.65);
        this.add(bonusTime);
    }
}

export default CardBonus;

CardBonus.prototype.BONUS_EXTRA_CARDS = "ExtraCards";
CardBonus.prototype.BONUS_CARD_REVEAL = "CardReveal";
