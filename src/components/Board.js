import SolitaireHolder from "./SolitaireHolder";
import SolitaireCard from "./SolitaireCard";

class Board extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y, [] );
        config.scene.add.existing(this);
        this.config = config;

    }

    Init(slots, animate){
        console.log("I've got "+slots.length+" slots");
        this.holders = [];

        var curLayer = 0;
        var cardsFoundInLayer = true;
        var oldHoldersLength = this.holders.length;
        var boardIndex = 0;

         while (cardsFoundInLayer){
             oldHoldersLength = this.holders.length;
            for (var i=0; i<slots.length; i++){
                if (slots[i].sortingOrder.toString() != curLayer.toString()) continue;
                var slot = slots[i];

                var boardHolderConfig = {
                    scene: this.config.scene,
                    x: slot.posX*(100),
                    y: slot.posY*(-100),
                    holderName: SolitaireHolder.prototype.boardHolder + "-" + i,
                    dependency : slot.dependency,
                    web : slot.web,
                    bonus : slot.bonus,
                    boardOrder : i
                }

                var boardHolder = new SolitaireHolder(boardHolderConfig);
                boardHolder.angle = slot.rotation*(-1);

                var boardCardConfig = {
                    scene: this.config.scene,
                    x: 0,
                    y: 0,
                    cardVal : slot.card,
                    faceDown : slot.faceDown
                }

                var bCard = new SolitaireCard(boardCardConfig);
                boardHolder.addCard(bCard);
                boardHolder.setVisible(false);

                this.holders.push(boardHolder);
                this.add(boardHolder);
                boardIndex++;
            }
            if (oldHoldersLength == this.holders.length)
                cardsFoundInLayer = false;
            curLayer++;
        }

        this.holders.sort(function(a,b){return a.BoardOrder - b.BoardOrder});
        if (animate)
            this.animateBoard();
        else
            this.updateSelectableHolders();

    }

    animateBoard(){
        var startPoint = {_x : this.config.width*0.9, _y : this.config.height*0.9};

        var holderTweens = [];
        for (var i=0; i< this.holders.length; i++){
            var targetHolder = this.holders[i];
            targetHolder.x = startPoint._x;
            targetHolder.y = startPoint._y;
            holderTweens.push({
                targets : targetHolder,
                ease : 'Linear',
                duration : 120,
                x : targetHolder.getHolderPosition()._x,
                y : targetHolder.getHolderPosition()._y,
                onStart: this.onHolderAnimStartHandler,
                onStartParams: [ targetHolder ],
                onComplete : ()=>{ }
            })
        }

        var timeline = this.config.scene.tweens.timeline({
           tweens: holderTweens,
            onStart: ()=>{this.config.scene.isMoving = true},
           onComplete: ()=>{ this.config.scene.isMoving = false; this.updateSelectableHolders();}
        });

        // timeline.play();
    }

    onHolderAnimStartHandler (tween, targets, gameObject)    {
        gameObject.setVisible(true);
    }



    updateSelectableHolders(){
        for(var i = 0; i < this.holders.length; i++){
            var shouldBeActive = this.isSelectableHolder(this.holders[i]);
            this.holders[i].set_Active(shouldBeActive);
        }
    }

    isSelectableHolder(holder) {
        // console.log(' > ------ > isSelectableHolder for:'+holder.holderName);
        if(holder==null || holder.getCardsNum() == 0){
            // console.log('>------> cardsNum = '+holder.getCardsNum());
            return false;
        }


        for(var i = 0; i < holder.dependency.length; i++){
            var _depHolder = this.holders[holder.dependency[i]];
            // console.log('>------> dependency - '+i+' is board holder '+_depHolder.holderName+':');
            if (_depHolder.getCardsNum() > 0) {
                // console.log('>------> dependency has cards');
                return false;
            }
        }
        // console.log(' > ------ > '+holder.holderName+ ' isSelectable');
        return true;
    }

    getHolder(_holderName){
        // console.log("getHolder for:"+_holderName);
        for (var i=0; i< this.holders.length; i++){
            if (this.holders[i].holderName == _holderName)
                return this.holders[i];
        }
        return null;
    }

    flipCards(cards){
        for (var a = 0; a < cards.length; a++)
        {
            console.log("FlipCards, must flip cards[" + a + "] = " + cards[a]);
            if (this.holders[cards[a]].topCard!=null)
                this.holders[cards[a]].topCard.setFaceDown(false);
        }
    }
}

export default Board;
