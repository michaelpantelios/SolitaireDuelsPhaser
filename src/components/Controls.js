import SolitaireHolder from "./SolitaireHolder";
import SolitaireCard from "./SolitaireCard";
import Server from "./Server";
import CardBonus from "./CardBonus";


class Controls extends Phaser.GameObjects.Container {
    constructor(config){
        super(config.scene, config.x, config.y, [] );
        config.scene.add.existing(this);
        this.config = config;

        this.remainingTime = 0;
        this.cardsLeft = 0;

        this.undoQueue = [];

        this.hasMagicWand = false;

        this.isMoving = false;

        const bg = new Phaser.GameObjects.Image(config.scene, 0, 0, 'board1', 'bottomBar');
        bg.scaleX = 1.5;
        bg.scaleY = bg.scaleX;
        bg.x = config.width*0.5;
        bg.y = config.height - bg.displayHeight*0.5;
        bg.name = 'bg';
        this.setData('_height', bg.displayHeight);
        this.add(bg);

        var deckCardsNumText = new Phaser.GameObjects.Text(config.scene, 0,0, '99', {});
        deckCardsNumText.setOrigin(0.5);
        deckCardsNumText.x = bg.x;
        deckCardsNumText.y = bg.y + 74;
        deckCardsNumText.setStyle({
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center' });
        this.add(deckCardsNumText);
        deckCardsNumText.name = 'deckCardsNumText';

        var gameTimeBarHolder = new Phaser.GameObjects.Image(config.scene, 0, 0,'board1', 'timerEmpty');
        gameTimeBarHolder.x = bg.x;
        gameTimeBarHolder.y =  bg.y + 120;
        this.add(gameTimeBarHolder);

        const gameTimeBar = new Phaser.GameObjects.Sprite(config.scene, 0, 0, 'board1', 'timerFull');
        gameTimeBar.x = gameTimeBarHolder.x;
        gameTimeBar.y = gameTimeBarHolder.y;
        this.add(gameTimeBar);
        this.gameTimeBar = gameTimeBar;

        const timeBarMask = config.scene.add.graphics();
        timeBarMask.fillStyle(0xff0000, 1);
        timeBarMask.fillRect(0, 0, this.gameTimeBar.width*0.5, this.gameTimeBar.height);
        timeBarMask.x = gameTimeBar.x-gameTimeBar.width*0.5;
        timeBarMask.y = gameTimeBar.y-gameTimeBar.height*0.5;
        var mask = timeBarMask.createGeometryMask();
        timeBarMask.setVisible(false);
        gameTimeBar.mask = mask;

        const btnMagicWand = new Phaser.GameObjects.Image(config.scene, 0, 0,'board1', 'btnMagicWand_idle');
        btnMagicWand.x = 55;
        btnMagicWand.y = bg.y-150;
        this.add(btnMagicWand);
        btnMagicWand.setInteractive();
        btnMagicWand.on('pointerdown', () => {  this.onMagicWandClicked(); });

        const btnExtraCards = new Phaser.GameObjects.Image(config.scene, 0, 0,'board1', 'btnExtraCards_idle');
        btnExtraCards.x = 55;
        btnExtraCards.y = bg.y;
        this.add(btnExtraCards);
        btnExtraCards.setInteractive();
        btnExtraCards.on('pointerdown', () => {  this.onExtraCardsClicked(); });

        let btnShuffle = new Phaser.GameObjects.Image(config.scene, 0, 0,'board1', 'btnShuffle_idle');
        btnShuffle.x = bg.x + 480;
        btnShuffle.y = bg.y-150;
        this.add(btnShuffle);
        btnShuffle.setInteractive();
        btnShuffle.on('pointerdown', () => {  this.onShuffleClicked(); });

        const btnUndo = new Phaser.GameObjects.Image(config.scene, 0, 0,'board1', 'btnUndo_idle');
        btnUndo.x = bg.x + 480;
        btnUndo.y = bg.y;
        this.add(btnUndo);
        btnUndo.setInteractive();
        btnUndo.on('pointerdown', () => {  this.onUndoClicked(); });

        this.timeBar = timeBarMask;

        //------------- add powerups ---------------------
    }

    Init(boardData, levelTime){
        // console.log("controls Init");
        this.IsPendingResponse = false;
        this.hasMagicWand = false;
        this.undoQueue = [];
        this.levelTime = levelTime;
        this.timeBar.clear();
        this.timeBar.fillRect(0, 0, this.gameTimeBar.width*0.4, this.gameTimeBar.height);

        this.cardsLeft = boardData.deckHolder.length;

        var deckHolderConfig = {
            scene: this.config.scene,
            x: this.getByName('bg').x,
            y: this.getByName('bg').y-35,
            holderName: SolitaireHolder.prototype.deckHolder
        }

        this.deckHolder = new SolitaireHolder(deckHolderConfig);
        this.add(this.deckHolder);

        for(var i=0; i< boardData.deckHolder.length; i++){
             // console.log('deck adding card:'+boardData.deckHolder[i]);
            var deckCardConfig = {
                scene: this.config.scene,
                x: 0,
                y: 0,
                cardVal : boardData.deckHolder[i],
                faceDown : true
            }

            this.dCard = new SolitaireCard(deckCardConfig);
            this.deckHolder.addCard(this.dCard);
        }

        var mainHolderConfig = {
            scene: this.config.scene,
            x: this.getByName('bg').x + 155,
            y: this.getByName('bg').y + 5,
            holderName: SolitaireHolder.prototype.mainHolder
        }
        this.mainHolder = new SolitaireHolder(mainHolderConfig);
        this.add(this.mainHolder);

        var mainCardConfig = {
            scene: this.config.scene,
            x: 0,
            y: 0,
            cardVal : boardData.mainHolder[0],
            faceDown : false
        }

        this.mCard = new SolitaireCard(mainCardConfig);
        this.mainHolder.addCard(this.mCard);

        var jokerHolderConfig = {
            scene: this.config.scene,
            x: this.getByName('bg').x + 300,
            y: this.getByName('bg').y + 5,
            holderName: SolitaireHolder.prototype.jokerHolder
        }
        this.jokerHolder = new SolitaireHolder(jokerHolderConfig);
        this.add(this.jokerHolder);

        var jokerCardConfig = {
            scene: this.config.scene,
            x: 0,
            y: 0,
            cardVal : -1,
            faceDown : false
        }

        this.jCard = new SolitaireCard(jokerCardConfig);
        this.jokerHolder.addCard(this.jCard);

        var primarySaveHolderConfig = {
            scene:  this.config.scene,
            x: this.getByName('bg').x-300,
            y: this.getByName('bg').y+5,
            holderName: SolitaireHolder.prototype.primarySaveHolder
        }
        this.primarySaveHolder = new SolitaireHolder((primarySaveHolderConfig));
        this.add(this.primarySaveHolder);

        var secondarySaveHolderConfig = {
            scene: this.config.scene,
            x: this.getByName('bg').x-155,
            y: this.getByName('bg').y+5,
            holderName: SolitaireHolder.prototype.secondarySaveHolder
        }
        this.secondarySaveHolder = new SolitaireHolder((secondarySaveHolderConfig))
        this.add(this.secondarySaveHolder);

        this.resetControls();
        this.updateControls();
    }

    resetControls(){
        this.deckHolder.set_Active(true);
        this.mainHolder.set_Active(true);
        this.jokerHolder.set_Active(true);
        this.primarySaveHolder.set_Active(true);
        this.secondarySaveHolder.set_Active(true);
    }

    updateControls(){

        this.getByName('deckCardsNumText').text = this.deckHolder.getCardsNum().toString();
    }

    get MainHolder(){
        return this.mainHolder;
    }

    get DeckHolder(){
        return this.deckHolder;
    }

    get JokerHolder(){
        return this.jokerHolder;
    }

    get PrimarySaveHolder(){
        return this.primarySaveHolder;
    }

    get SecondarySaveHolder(){
        return this.secondarySaveHolder;
    }

    get IsMoving(){
        return this.isMoving;
    }

    set IsMoving(val){
        this.isMoving = val;
    }

   HasMagicWand(val){
        this.hasMagicWand = val;

       if (this.hasMagicWand && this.magicWand==null)
           this.createWand();

       if (!this.hasMagicWand && this.magicWand != null)
       {
           this.destroy(this.magicWand);
       }
    }

    createWand()    {
        this.magicWand = new Phaser.GameObjects.Image(this.config.scene, 0, 0,'board1', 'wand');;
        this.add(this.magicWand);
    }

    isTransferAllowed(from, to){
        console.log("isTransferAllowed from "+from+ " to "+ to +" ?");
        console.log("primary.cardsNum  = "+this.primarySaveHolder.getCardsNum() );
        console.log("main.cardsNum  = "+this.mainHolder.getCardsNum() );
        console.log("main.top.cardVal  = "+this.mainHolder.getTopCard().getCardVal() );
        console.log("primary is Active? " +this.primarySaveHolder.is_Active());

        if(from == SolitaireHolder.prototype.deckHolder && to == SolitaireHolder.prototype.mainHolder && this.deckHolder.getCardsNum() > 0)
            return true;
        if(from == SolitaireHolder.prototype.jokerHolder && to == SolitaireHolder.prototype.mainHolder && this.jokerHolder.getCardsNum() > 0 && this.jokerHolder.is_Active())
            return true;
        if(from == SolitaireHolder.prototype.mainHolder && to == SolitaireHolder.prototype.primarySaveHolder && this.primarySaveHolder.is_Active() && this.primarySaveHolder.getCardsNum() == 0 && this.mainHolder.getCardsNum() > 1 && this.mainHolder.getTopCard().getCardVal() != -1)
            return true;
        if(from == SolitaireHolder.prototype.mainHolder && to == SolitaireHolder.prototype.secondarySaveHolder && this.secondarySaveHolder.is_Active() && this.secondarySaveHolder.getCardsNum() == 0 && this.mainHolder.getCardsNum() > 1 && this.mainHolder.getTopCard().getCardVal() != -1)
            return true;
        if(from == SolitaireHolder.prototype.primarySaveHolder && to == SolitaireHolder.prototype.mainHolder && this.primarySaveHolder.getCardsNum() > 0)
            return true;
        if(from == SolitaireHolder.prototype.secondarySaveHolder && to == SolitaireHolder.prototype.mainHolder && this.secondarySaveHolder.getCardsNum() > 0)
            return true;
        if(from.includes(SolitaireHolder.prototype.boardHolder) && to == SolitaireHolder.prototype.mainHolder && this.mainHolder.topCard != null)
        {
            var slot = this.config.scene.Board.getHolder(from);
            if(slot != null && slot.getTopCard() != null)
                var cardVal = slot.getTopCard().getCardVal();

            var lastCard = this.mainHolder.getTopCard().getCardVal();

            if(slot.is_Active() && (cardVal == lastCard + 1 || cardVal == lastCard - 1 || (cardVal == 1 && lastCard == 13) || (cardVal == 13 && lastCard == 1) || lastCard == -1 || cardVal == -1))
                return true;
        }

        return false;
    }

    transferCard(res){
        if (!res){
            console.log("Server: Invalid cards transfer");
            return;
        }
        console.log('transferCard');
        this.doTransferCard(res.from, res.to);
        this.updateControls();
    }

    doTransferCard(from, to, isUndo = false){
        console.log('Controls: doTransferCard, from: '+from + ", to: "+to+", isUndo: "+isUndo);
        var fromHolder = {};
        var toHolder = {};

        switch(from)
        {
            case SolitaireHolder.prototype.deckHolder:
                fromHolder = this.deckHolder;
                break;
            case SolitaireHolder.prototype.jokerHolder:
                fromHolder = this.jokerHolder;
                break;
            case SolitaireHolder.prototype.mainHolder:
                fromHolder = this.mainHolder;
                break;
            case SolitaireHolder.prototype.primarySaveHolder:
                fromHolder = this.primarySaveHolder;
                break;
            case SolitaireHolder.prototype.secondarySaveHolder:
                fromHolder = this.secondarySaveHolder;
                break;
            default:
                fromHolder = this.config.scene.Board.getHolder(from);
                break;
        }

        switch(to)
        {
            case SolitaireHolder.prototype.deckHolder:
                toHolder = this.deckHolder;
                break;
            case SolitaireHolder.prototype.jokerHolder:
                toHolder = this.jokerHolder;
                break;
            case SolitaireHolder.prototype.mainHolder:
                toHolder = this.mainHolder;
                break;
            case SolitaireHolder.prototype.primarySaveHolder:
                toHolder = this.primarySaveHolder;
                break;
            case SolitaireHolder.prototype.secondarySaveHolder:
                toHolder = this.secondarySaveHolder;
                break;
            default:
                toHolder = this.config.scene.Board.getHolder(to);
                break;
        }

        let card = fromHolder.removeCard();
        this.add(card);
        // card.parentContainer = this;
        var cardPos = fromHolder.getHolderPosition();
        console.log(" --> cardPos : "+cardPos._x+", "+cardPos._y);
        var cardDest = toHolder.getHolderPosition();
        console.log(" --> cardDest : "+cardDest._x+", "+cardDest._y);
        card.x = cardPos._x;
        card.y = cardPos._y;

        // parent.addChild(card);


        if(from == SolitaireHolder.prototype.deckHolder)
        {
            card.setFaceDown(false, true);
            //todo  ZSolitaire.instance.board.highlightMissedMatches();
        }
        if(to == SolitaireHolder.prototype.deckHolder)
            card.setFaceDown(true, true);
        if(from == SolitaireHolder.prototype.jokerHolder)
        {
            //todo jokerHelper.startCoolDown();
            // this.jokerHolder.set_Active(false);
        }
        if(to == SolitaireHolder.prototype.jokerHolder)
        {
           //todo  jokerHelper.stopCoolDown();
           //todo  jokerHelper.lock(true);
           //  this.jokerHolder.set_Active(true);
        }
        if(from == SolitaireHolder.prototype.primarySaveHolder && !isUndo)
        {
            // primarySaveHelper.unlock();
            // this.primarySaveHolder.set_Active(false);
        }
        if(from == SolitaireHolder.prototype.secondarySaveHolder && !isUndo)
        {
           // secondarySaveHelper.unlock();
           //  this.secondarySaveHolder.set_Active(false);
        }
        if(to == SolitaireHolder.prototype.primarySaveHolder && isUndo)
        {
            //primarySaveHelper.lock(true);
           this.primarySaveHolder.set_Active(true);
        }
        if(to == SolitaireHolder.prototype.secondarySaveHolder && isUndo)
        {
            //secondarySaveHelper.lock(true);
            this.secondarySaveHolder.set_Active(true);
        }

        if(to == SolitaireHolder.prototype.mainHolder && fromHolder.isBoardHolder)
        {
             console.log("************ Has slot bonus ? "+ fromHolder.hasBonus());

            //todo
            if(fromHolder.hasBonus())
               this.onAwardComplete( this.config.scene.gameCommand(Server.prototype.GAME_COMMAND_AWARD_BONUS, {from: fromHolder.holderName}) );


            // cardEffect = new PDParticleSystem(ZSolitaireParticlesProvider.wandPex, ZAssetsManager.instance.getTexture("effects/star"));
            // if(cardEffect)
            // {
            //     Starling.juggler.add(cardEffect);
            //     cardEffect.x = fromSlot.x;
            //     cardEffect.y = fromSlot.y;
            //     cardEffect.start(0.1);
            //     parent.addChild(cardEffect);
            //     cardEffect.addEventListener(Event.COMPLETE, function():void {Starling.juggler.remove(cardEffect); cardEffect.removeFromParent(true);});
            // }
        }

        this.isMoving = true;
        var cardTween = this.config.scene.tweens.add({
           targets:card,
           x : cardDest._x,
           y : cardDest._y,
           duration : SolitaireCard.turnDuration,
            onComplete : ()=> {onCardFlyComplete(this, from, to);}
        });

        var onCardFlyComplete = function(controlsObj, from, to){
            console.log('onCardFlyComplete');
            toHolder.addCard(card);
            controlsObj.config.scene.Board.updateSelectableHolders();

            console.log("isUndo? :"+isUndo);
            console.log("controlsObj.undoQueue.length = " + controlsObj.undoQueue.length);


            if (!isUndo)
            {
                if (controlsObj.undoQueue.length > 0)
                    controlsObj.undoQueue.splice(controlsObj.undoQueue.length - 1, 1);
                console.log("from: "+from+", to : "+to);
                controlsObj.undoQueue.push({ from : to, to : from});
            }

            controlsObj.IsMoving = false;
        }

        console.log('Main holder cardsNum = ' + this.mainHolder.getCardsNum());

    }

    removeWeb(res){
        if(!res)
        {
            console.log("RemoveWeb, controls: Invalid web remove");
            return;
        }
        console.log("removeWeb for holder:"+res.from);
        this.clearUndoQueue();

        var slot = this.config.scene.Board.getHolder(res.from);
        slot.setWeb(false);

        var card = this.mainHolder.removeCard();
        console.log("Controls.removeWeb, mainHolder.cardsNum = "+this.mainHolder.getCardsNum());
        if (this.mainHolder.getCardsNum() == 0){
            console.log("Controls.removeWeb, res.randomCard = "+res.randomCard);
            var randomCardConfig = {
                scene: this.config.scene,
                x: 0,
                y: 0,
                cardVal : res.randomCard,
                faceDown : false
            }

            var rCard = new SolitaireCard(randomCardConfig);
            this.mainHolder.addCard(rCard);
        }
    }

    resetHoldersForFault(board)
    {
        this.deckHolder.resetHolder(board.deckHolder);
        this.mainHolder.resetHolder(board.mainHolder);
        this.jokerHolder.resetHolder(board.jokerHolder);
        this.primarySaveHolder.resetHolder(board.primaryHolder);
        this.secondarySaveHolder.resetHolder(board.secondaryHolder);

        this.primarySaveHolder.active = board.primaryHolderActive;
        this.secondarySaveHolder.active = board.secondaryHolderActive;

        this.clearUndoQueue();
    }

    onAwardComplete(res){
        if (!res.success){
            console.log('AWARD FAILED. DAFUUUCK?');
            return;
        } else {
            console.log("^v^v^v^v^v^v^v onAwardComplete:"+res.bonusType);
            if (res.bonusType == CardBonus.prototype.BONUS_EXTRA_CARDS)
                this.addExtraCards(res.data);
            else this.config.scene.Board.flipCards(res.data);
        }

    }

    addExtraCards(extraCards){
        console.log("--------- addExtraCards, deckHolder.length: BEFORE: "+this.deckHolder.length);
        for (var i=0; i<extraCards.length; i++)
        {
            var extraCardConfig = {
                scene: this.config.scene,
                x: 0,
                y: 0,
                cardVal : extraCards[i],
                faceDown : true
            }

            var eCard = new SolitaireCard(extraCardConfig);
            this.deckHolder.addCard(eCard, true);
        }
        this.updateControls();
        console.log("--------- addExtraCards, deckHolder.length: AFTER:  "+this.deckHolder.length);

    }

    onShuffleClicked(){
        console.log("LETS SHUFFLE!");
        this.config.scene.IsPendingResponse = true;
        let res = this.config.scene.gameCommand(Server.prototype.GAME_COMMAND_SHUFFLE);
       if (res.success)
            this.config.scene.Board.shuffle(res.slots);
       else {
           console.log("Controls shuffle error ! ");
           this.config.scene.IsPendingResponse = false;
       }
    }

    onMagicWandClicked(){
        console.log("LET'S BUY MAGIC WAND!");

        if (!this.hasMagicWand)
        {
          var buyMagicWandRes = this.config.scene.gameCommand(Server.prototype.GAME_COMMAND_BUY_MAGIC_WAND);
          if (buyMagicWandRes.success)
              this.HasMagicWand(true);
        } else console.log("Controls buy magic Wand error ! ");

    }

    useMagicWand(res) {
        console.log("LET'S USE MAGIC WAND!");
        this.config.scene.IsPendingResponse = false;
        if (res.success) {
            this.clearUndoQueue();

            let holder = this.config.scene.Board.getHolder(res.magicHolder);

            this.doUseMagicWand(holder);
        } else console.log("Magic Wand Use error");

    }

    doUseMagicWand(holder) {
        if (holder.hasWeb())
            holder.web = false;

        let card = holder.removeCard();

        if (holder.isBoardHolder && holder.bonus!="" && holder.bonus !=null)
            this.onAwardComplete( this.config.scene.gameCommand(Server.prototype.GAME_COMMAND_AWARD_BONUS, {from: holder.holderName}) );

        this.destroy(card);
        this.config.scene.Board.updateSelectableHolders();

    }

    onExtraCardsClicked(){
        this.config.scene.IsPendingResponse = true;
        let res = this.config.scene.gameCommand(Server.prototype.GAME_COMMAND_EXTRA_CARDS);
        if (res.success)
            this.addExtraCards(res.extraCards);
        else {
            console.log("Controls extraCards error ! ");
        }
        this.config.scene.IsPendingResponse = false;
    }

    onUndoClicked(){
        console.log("LETS UNDO!");
        this.config.scene.IsPendingResponse = true;
        let res = this.config.scene.gameCommand(Server.prototype.GAME_COMMAND_UNDO);
        if (res.success)
            this.undo();
        else {
            console.log("Server undo error ! ");
            this.config.scene.IsPendingResponse = false;
        }
    }

    undo(){
        let undoAction = this.undoQueue[this.undoQueue.length- 1];
        console.log("undoAction : from : "+undoAction.from + ", to: "+undoAction.to);
        this.clearUndoQueue();

        this.doTransferCard( undoAction.from, undoAction.to, true);
        this.config.scene.IsPendingResponse = false;
    }

    clearUndoQueue(){
        this.undoQueue = [];
    }
}

export default Controls;
