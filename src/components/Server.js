import CardBonus from "./CardBonus";

const EventEmitter = require('events');


class Server extends EventEmitter {
    constructor(props) {
        super(props);

        this.state = {};

        this.state.version = -1;
        this.state.status = this.STATUS_IDLE;

        this.state.maxPlayers = 2;
        this.players = [];

    }

    Initialize(levelsArr){
        this.levelsArr = levelsArr;
        console.log("LEVELS :"+ levelsArr.length);
    }

    EmitNewState(){
        this.state.version++;
        this.emit('newState', this.state);
    }

    startNewServerGame(){
        var level = this.levelsArr[0];
        var layout = level.layouts[Math.floor(Math.random()*level.layouts.length)];
        console.log("Layout :"+layout.layoutId);

        var players = [];
        var boards = [];
        for (var i=0; i< this.players.length; i++){
            var playerState = {};
            playerState.playerName = this.players[i].playerName;
            playerState.playerId = this.players[i].playerId;
            playerState.pos = i;
            playerState.multiplier = 0;
            playerState.progress = 0;
            playerState.score = 0;
            playerState.scoresQueue = [];

            if (i == 0)
                boards.push(this.createBoardState(layout))
            else boards.push(this.copyBoardState(boards[0]));

            playerState.cardsLeft = boards[i].deckHolder.length;

            players.push(playerState);
        }

        console.log('board.deckHolder.length = '+boards[0].deckHolder.length);

        this.state.players = players;
        this.state.boards = boards;
        this.state.iceShots = [{shootNo:0, score:0}, {shootNo:0, score:0}];
        this.state.iceCounter = 0;
        this.state.inGame = [false, false];
        this.state.doneUser = "";
        this.state.levelTime = 240;
        this.state.powerupconsts = [1,1,1,1,1,1];
    }

    createBoardState(layout){
        var boardState = {};
        boardState.mainHolder = [this.getRandomCard()];
        boardState.jokerHolder = [-1];
        boardState.primaryHolder = [];
        boardState.secondaryHolder = [];
        boardState.primaryHolderActive = true;
        boardState.secondaryHolderActive = true;
        boardState.undoQueue = [];
        boardState.sevenOverJoker = false;
        boardState.cardsHistory = this.getCardLetter( boardState.mainHolder[0] );
        boardState.shuffleAttempts = 0;
        boardState.slots = this.createSlotsBoard(layout.slots, layout.specialCards);
        boardState.deckHolder = this.createDeck(layout.cardsInDeck);
        boardState.initialCardsNum = boardState.slots.length;
        return boardState;
    }

    copyBoardState(bState){
        var boardState = {};
        boardState.mainHolder = [bState.mainHolder[0]];
        boardState.jokerHolder = [-1];
        boardState.primaryHolder = [];
        boardState.secondaryHolder = [];
        boardState.primaryHolderActive = bState.primaryHolderActive;
        boardState.secondaryHolderActive = bState.secondaryHolderActive;
        boardState.undoQueue = [];
        boardState.sevenOverJoker = bState.sevenOverJoker;
        boardState.cardsHistory = this.getCardLetter( boardState.mainHolder[0] );
        boardState.shuffleAttempts = 0;
        boardState.slots = [];
        for (var i=0; i<bState.slots.length; i++)
            boardState.slots.push(this.copySlot(bState.slots[i]));
        boardState.deckHolder = [];
        for (var j=0; j<bState.deckHolder.length; j++)
            boardState.deckHolder.push(bState.deckHolder[j]);
        boardState.initialCardsNum = boardState.slots.length;
        return boardState;
    }

    copySlot(_slot){
        var slot = {};
        slot.card = _slot.card;
        slot.posX = _slot.posX;
        slot.posY = _slot.posY;
        slot.dependency = [];
        for(var i=0; i<_slot.dependency.length; i++)
            slot.dependency.push(_slot.dependency[i]);
        slot.faceDown = _slot.faceDown;
        slot.rotation = _slot.rotation;
        slot.web = _slot.web;
        slot.bonus = _slot.bonus;
        slot.sortingOrder = _slot.sortingOrder;
        return slot;
    }

    createSlotsBoard(slots, specialCards){
        var slotsBoard = [];
        slots.forEach(createNewBoardSlot);

        function createNewBoardSlot(slot,index){
            var bslot = {};
            bslot.card = Math.round(Math.random()*12) + 1;
            bslot.posX = slot.posX;
            bslot.posY = slot.posY;
            bslot.dependency = slot.dependency;
            bslot.faceDown = slot.faceDown;
            bslot.rotation = slot.rotation;
            bslot.web = slot.web;
            bslot.bonus = "";
            bslot.sortingOrder = slot.sortingOrder;
            slotsBoard.push(bslot);
            // console.log("Server.createSlotsBoard, BOARD_HOLDER-"+index.toString()+" has : "+bslot.card);
        }

        if (specialCards.length > 0)
        {
            var slotsHaveBonus = [];
            var randSlotForBonus;

            for (var i = 0; i < specialCards.length; i++)
            {
                console.log("This layout has special card " + i + " : " + specialCards[i]);
                randSlotForBonus = Math.floor(Math.random()*slotsBoard.length);
                while (this.arrayContainsInt(slotsHaveBonus,randSlotForBonus) || slotsBoard[randSlotForBonus].web)
                    randSlotForBonus = Math.floor(Math.random()*slotsBoard.length);
                slotsHaveBonus.push(randSlotForBonus);
                slotsBoard[randSlotForBonus].bonus = specialCards[i];
            }
        }

        return slotsBoard;
    }

    createDeck(cardsInDeck){
        var deck = [];

        for (var i = 0; i < cardsInDeck; i++){
            var c = this.getRandomCard();
            // console.log('creating deck, added:'+c);
            deck.push(c);
        }

        return deck;
    }

    Command(cmd,pos,playerId, val){
        switch (cmd){
            case this.GAME_COMMAND_PLAYER_CONNECTED:
                var playerData = val[0];
                if (this.playerAlreadyConnected(playerData.playerId))
                    return false;
                // console.log('Server connect player with playerName ='+playerData.playerName);
                this.players.push(playerData);

                // console.log('State current players = '+this.players.length);
                if (this.players.length == this.state.maxPlayers){
                    this.state.status = this.STATUS_PLAYING;
                    this.startNewServerGame();
                }
                this.EmitNewState();
                return true;
            case this.GAME_COMMAND_TRANSFER_CARD:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' )))))))))))))))))))');
                var bstate = this.state.boards[pos];
                var player = this.state.players[pos];

                var fromCard = this.getCard(bstate, val.from);
                var toCard = this.getCard(bstate, val.to);
                var result = this.transferCard(bstate, val.from, val.to);

                bstate.cardsLeft = bstate.deckHolder.length;

                var boardCardsLeft = this.countCardsLeft(bstate);
                if(result && this.isScoreMove(bstate, val.from, val.to))
                {
                    this.increaseScore(player);
                    this.updateProgress(player,(bstate.initialCardsNum - boardCardsLeft) / bstate.initialCardsNum);

                    if(!this.state.doneUser)
                        this.state.iceCounter++;
                }

                if(result && !this.isScoreMove(bstate, val.from, val.to))
                    player.multiplier = 0;
                if(boardCardsLeft == 0)
                    player.score += Server.emptyBoardScore;

                // this.state.boards[pos] = bstate;
                // this.state.players[pos] = player;

                // console.log("Server, pos 0 main cardsNum: "+this.state.boards[0].mainHolder.length);
                // console.log("Server, pos 1 main cardsNum: "+this.state.boards[1].mainHolder.length);

                // for (var m=0; m<this.state.boards[0].slots.length; m++){
                //     console.log('Server : board '+0+', BOARD_HOLDER-'+m+' has: ' + this.state.boards[0].slots[m].card );
                // }
                //
                // for (var n=0; n<this.state.boards[1].slots.length; n++){
                //     console.log('Server : board - '+1+', BOARD_HOLDER-'+n+' has: ' + this.state.boards[1].slots[n].card );
                // }

                //todo
                // this.checkTrophies(pos, false);
                //
                // if(boardCardsLeft == 0)
                //     this.finishGame(this.findWinner(), false);
                // else if(this.doneUser)
                // {
                //     var donePos = this.players[0].userId == this.doneUser ? 0 : 1;
                //
                //     if((donePos == 0 && this.players[1].score > this.players[0].score) || (donePos == 1 && this.players[0].score > this.players[1].score))
                //         this.finishGame(this.findWinner(), false);
                //     else if(this.isTournament)
                //     {
                //         if(boardCardsLeft == 10)
                //             this.manager.broadcastInGameMessage(this.tableId, userId, "ingame_cardsLeft", [boardCardsLeft]);
                //         if(boardCardsLeft == 15)
                //             this.manager.broadcastInGameMessage(this.tableId, userId, "ingame_cardsLeft", [boardCardsLeft]);
                //
                //         if(this.players[1].score - this.players[0].score >= 200 && !this.inGame.bigAdvantage1)
                //         {
                //             this.inGame.bigAdvantage1 = true;
                //             this.manager.broadcastInGameMessage(this.tableId, this.players[1].userId, "ingame_bigAdvantage");
                //         }
                //         else
                //             this.inGame.bigAdvantage1 = false;
                //
                //         if(this.players[0].score - this.players[1].score >= 200 && !this.inGame.bigAdvantage0)
                //         {
                //             this.inGame.bigAdvantage0 = true;
                //             this.manager.broadcastInGameMessage(this.tableId, this.players[0].userId, "ingame_bigAdvantage");
                //         }
                //         else
                //             this.inGame.bigAdvantage0 = false;
                //     }
                // }

                if(result)
                    return {success: true};
                else
                    return {success: false, pos: pos, from: val.from, to: val.to, fromCard: fromCard, toCard: toCard, board: this.state.boards[pos]};

            case this.GAME_COMMAND_REMOVE_WEB:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' )))))))))))))))))))');
                var bstate = this.state.boards[pos];

                var removeResult = this.removeWeb(bstate, val.from);
                console.log("Server, REMOVE WEB:, removeResult:"+removeResult.success);
                if(removeResult.success)
                    return {success: true, from: val.from, randomCard: removeResult.randomCard };
                else
                    return {success: false};

            case this.GAME_COMMAND_AWARD_BONUS:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' ,val = '+val.from+' )))))))))))))))))))');
                var bstate = this.state.boards[pos];

                var awardResult = this.awardBonus(bstate, val.from );
                if (awardResult)
                    return {success: true, data: awardResult.data, bonusType: awardResult.bonus}
                else return {success : false};

            case this.GAME_COMMAND_SHUFFLE:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' )))))))))))))))))))');
                var bstate = this.state.boards[pos];

                bstate.shuffleAttempts = 0;

                if (this.shuffle(bstate))
                    return {success: true, slots: bstate.slots}
                else return {success: false};

            case this.GAME_COMMAND_UNDO:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' )))))))))))))))))))');
                var bstate = this.state.boards[pos];

                let undoAction = bstate.undoQueue[bstate.undoQueue.length - 1];
                let res = this.undo(bstate);
                console.log("SERVER, undo res = "+res);
                this.state.players[pos].cardsLeft = bstate.deckHolder.length;

                if (res)
                {
                    // if (isScoreMove(state.boards[myPos], undoAction.to, undoAction.from))
                    // {
                    //     state.playerStates[myPos].revertScore();
                    //     state.playerStates[myPos].updateProgress((state.boards[myPos].initialCardsNum - countCardsLeft(state.boards[myPos])) / state.boards[myPos].initialCardsNum);
                    // }

                    return {success:true};
                } else return {success : false};
            case this.GAME_COMMAND_EXTRA_CARDS:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' )))))))))))))))))))');
                var bstate = this.state.boards[pos];

                var extraCardsRes = this.addExtraCards(bstate, Server.extraCardsPowerUp);
                console.log("extraCardsRes = "+extraCardsRes);
                this.state.players[pos].cardsLeft = bstate.deckHolder.length;

                if (extraCardsRes.length > 0)
                    return {success: true, extraCards: extraCardsRes};
                else return {success: false };
            case this.GAME_COMMAND_BUY_MAGIC_WAND:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+' )))))))))))))))))))');
                return {success: true};
            case this.GAME_COMMAND_USE_MAGIC_WAND:
                console.log("((((((((((((((((( SERVER GOT COMMAND: "+cmd+" from pos: "+ pos +" , "+playerId+', val[0]: '+val.slot + ' )))))))))))))))))))');
                var magicHolder = val.slot;
                var bstate = this.state.boards[pos];

                var magicWandRes = this.magicWand(bstate, magicHolder);
                if (magicWandRes)
                    return {success : true, magicHolder: magicHolder}
                else return {success : false};
        }
    }

    //---------------------- BOARD FUNCTIONS START -----------------------

    transferCard(board, from, to){
        var res = this.doTransferCard(board, from, to, false);
        if (res == true){
            this.updateSlots(board);
            if ( board.undoQueue.length > 0)
                board.undoQueue.pop();
            board.undoQueue.push({from: to, to: from});
        }

        return res;
    }

    doTransferCard(board, from, to, isUndo) {
        var card;

        if(from == Server.deckHolder && board.deckHolder.length > 0)
            card = board.deckHolder.pop();
        else if(from == Server.jokerHolder && board.jokerHolder.length > 0)
            card = board.jokerHolder.pop();
        else if(from == Server.mainHolder && board.mainHolder.length > 0)
        {
            card = board.mainHolder.pop();
            board.cardsHistory = board.cardsHistory.slice(0, -1);
        }
        else if(from == Server.primarySaveHolder && board.primaryHolder.length > 0)
        {
            card = board.primaryHolder.pop();
            // if(!isUndo)
            //     board.primaryHolderActive = false;
        }
        else if(from == Server.secondarySaveHolder && board.secondaryHolder.length > 0)
        {
            card = board.secondaryHolder.pop();
            // if(!isUndo)
            //     board.secondaryHolderActive = false;
        }
        else
        {
            console.log("SERVER : Let's tronsfer card from "+from);
            var fromData = from.split("-");
            if(fromData[0] == Server.boardHolder)
            {
                var slot = board.slots[parseInt(fromData[1])];
                console.log("SERVER : slot.card = "+ slot.card);
                if(slot)
                {
                    console.log("SERVER : card to transfer = "+ slot.card);
                    card = slot.card;
                    slot.card = 0;
                }
            }
        }
        console.log("SERVER: isCardAllowed ?:" +this.isCardAllowed(board, card, Server.mainHolder)) ;
        if(card)
        {
            console.log('********************** Server: Exw mia karta:'+card+' pou na ti valw?');

            if(to == Server.deckHolder && isUndo)
            {
                board.deckHolder.push(card);
                return true;
            }
            else if(to == Server.jokerHolder && isUndo)
            {
                board.jokerHolder.push(card);
                return true;
            }
            else if(to == Server.mainHolder && (from == Server.deckHolder || from == Server.primarySaveHolder || from == Server.secondarySaveHolder || this.isCardAllowed(board, card, Server.mainHolder)))
            {
                console.log("SERVER : Let's put card "+card+ " to mainHolder");
                var lastCard = board.mainHolder[board.mainHolder.length - 1];
                if(lastCard == -1)
                {
                    if(card == 7)
                        board.sevenOverJoker = true;

                    board.mainHolder.pop();
                    this.removeJokerFromUndo(board);
                }

                board.mainHolder.push(card);
                if(card != -1)
                    board.cardsHistory += this.getCardLetter(card);
                return true;
            }
            else if(to == Server.primarySaveHolder && (board.primaryHolderActive || isUndo) && board.mainHolder.length > 0 && card != -1)
            {
                board.primaryHolder.push(card);
                board.primaryHolderActive = true;
                return true;
            }
            else if(to == Server.secondarySaveHolder && (board.secondaryHolderActive ||  isUndo) && board.mainHolder.length > 0 && card != -1)
            {
                board.secondaryHolder.push(card);
                board.secondaryHolderActive = true;
                return true;
            }
            else
            {
                var toData = to.split("-");
                if(toData[0] == Server.boardHolder && !isNaN(toData[1]))
                {
                    var slot = board.slots[parseInt(toData[1])];
                    if(slot)
                    {
                        slot.card = card;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    removeWeb(board, from) {
        console.log("Server.removeWeb, from = "+from);
        var fromData = from.split("-");
        var res = {success : false};
        var card;

        if(fromData[0] == Server.boardHolder)
        {
            var slot = board.slots[parseInt(fromData[1])];
            if(slot && slot.web)
            {
                console.log("Server.removeWeb, slot has web");
                card = slot.card;
                if(this.isCardAllowed(board, card, Server.mainHolder))
                {
                    console.log("Server.removeWeb, card is allowed");
                    slot.web = false;
                    board.mainHolder.pop();
                    res.success = true;
                    if(board.mainHolder.length == 0)
                    {
                        console.log("Server.removeWeb, main holder has 0 cards");
                        res.randomCard = this.getRandomCard();
                        console.log("Server.removeWeb, randomCard"+res.randomCard);
                        board.mainHolder.push(res.randomCard);
                    }
                    board.cardsHistory = board.cardsHistory.slice(0, -1);

                    board.undoQueue = [];
                }
            }
        }

        return res;
    }

    awardBonus(board, from) {
        console.log("Server.awardBonus, from = "+from);
        var fromData = from.split("-");
        var res = {};
        if(fromData[0] == Server.boardHolder)
        {
            var slot = board.slots[parseInt(fromData[1])];
            if(slot && slot.bonus != "")
            {
                res.bonus = slot.bonus;

                if(slot.bonus == Server.BONUS_CARD_REVEAL)
                    res.data = this.flipCardsUp(board,2);
                else if(slot.bonus == Server.BONUS_EXTRA_CARDS)
                    res.data = this.addExtraCards(board,2);

                slot.bonus = "";

                return res;
            }
        }

        return null;
    }

    flipCardsUp(board, _cardsNum) {
        var cardsNum = _cardsNum;

        var faceDownSlots = [];
        for(var i = 0; i < board.slots.length; i++)
            if(board.slots[i].card != 0 && board.slots[i].faceDown)
                faceDownSlots.push(i);

        if(faceDownSlots.length < _cardsNum)
            cardsNum = faceDownSlots.length;

        var flipped = [];
        for(var j = 0; j < cardsNum; j++)
        {
            var index = Math.floor(Math.random() * faceDownSlots.length);
            board.slots[faceDownSlots[index]].faceDown = false;
            flipped.push(faceDownSlots[index]);
            faceDownSlots.splice(index, 1);
        }

        return flipped;
    }


    addExtraCards(board, cardsNum) {
        var newCards = [];
        for(var i = 0; i<cardsNum; i++)
        {
            var card = this.getRandomCard();
            board.deckHolder.push(card);
            newCards.push(card);
        }

        return newCards;
    }

    magicWand(board, slotName) {
        var slotData = slotName.split("-");

        if (slotData[0] == Server.boardHolder)
        {
            console.log("magicWand we have a boardHolder");
            var slot = board.slots[parseInt(slotData[1])];


            if (slot != null)
            {

                slot.card = 0;

                board.undoQueue = [];

                return true;
            }
        }

        return false;
    }

   shuffle(board) {
       board.shuffleAttempts++;
       var oldCards = []
       for (var i = 0; i < board.slots.length; i++)
           if (board.slots[i] != null && board.slots[i].card!=0 && !board.slots[i].faceDown)
               oldCards.push(board.slots[i].card);

       var changed = false;
       for (var j = 0; j < board.slots.length; j++)
       if (board.slots[j]!=null && board.slots[j].card!=0 && !board.slots[j].faceDown)
       {
           var index = Math.floor(Math.random() * oldCards.length);
           if (board.slots[j].card != oldCards[index])
               changed = true;
           board.slots[j].card = oldCards[index];
           oldCards.splice(index, 1);
       }

       board.undoQueue = [];

       if (!changed && board.shuffleAttempts < 30)
           this.shuffle(board);

       return changed;
    }

    extraJoker() { }

    unlockHolder() { }

    undo(board) {
        if (board.undoQueue.length > 0)
        {
            let action = board.undoQueue[board.undoQueue.length - 1];
            let undoResult = this.doTransferCard(board, action.from, action.to, true);

            return undoResult;
        }

        return false;
    }

    finishGame()
    {

    }

    findWinner(){

    }

    updateSlots(board) {
        for(var i = 0; i < board.slots.length; i++)
            if(board.slots[i].faceDown)
                board.slots[i].faceDown = !this.isSelectableSlot(board.slots[i]);
    }

    isSelectableSlot(board, slot) {
        if(slot == null || slot.card==0)
            return false;

        for(var i = 0; i < slot.dependency.length; i++)
            if(board.slots[slot.dependency[i]].card)
                return false;

        return true;
    }

    isCardAllowed(board, card, holder) {
        if(holder == Server.mainHolder)
        {
            var lastCard = board.mainHolder[board.mainHolder.length - 1];
            if(card == lastCard + 1 || card == lastCard - 1 || (card == 1 && lastCard == 13) || (card == 13 && lastCard == 1) || lastCard == -1 || card == -1)
                return true;
        }

        return false;
    }

    isScoreMove(board, from, to) {
        var fromData = from.split("-");
        if(fromData[0] == "slot" && !isNaN(fromData[1]))
        {
            var slot = board.slots[parseInt(fromData[1])];
            if(slot && to == Server.mainHolder)
                return true;
        }

        return false;
    }

    isDrawCard() { }

    countCardsLeft(board) {
        var cardsNo = 0;

        for(var i = 0; i < board.slots.length; i++)
            if(board.slots[i].card != 0)
                cardsNo++;

        return cardsNo;
    }

    removeJokerFromUndo(board) {
        for(var i = 0; i<board.undoQueue.length; i++)
            if(board.undoQueue[i].to == Server.jokerHolder)
            {
                board.undoQueue.splice(i, 1);
                i--;
            }
    }

    hasQueuedUndo(board) {

    }

   getCard(board, from) {
       var card;

       if(from == Server.deckHolder && board.deckHolder.length > 0)
           card = board.deckHolder[board.deckHolder.length - 1];
       else if(from == Server.jokerHolder && board.jokerHolder.length > 0)
           card = board.jokerHolder[board.jokerHolder.length - 1];
       else if(from == Server.mainHolder && board.mainHolder.length > 0)
           card = board.mainHolder[board.mainHolder.length - 1];
       else if(from == Server.primarySaveHolder && board.primaryHolder.length > 0)
           card = board.primaryHolder[board.primaryHolder.length - 1];
       else if(from == Server.secondarySaveHolder && board.secondaryHolder.length > 0)
           card = board.secondaryHolder[board.secondaryHolder.length - 1];
       else
       {
           var fromData = from.split("-");
           if(fromData[0] == "slot" && !isNaN(fromData[1]))
           {
               var slot = this.slots[parseInt(fromData[1])];
               if(slot)
                   card = slot.card;
           }
       }

       return card;
    }

    //---------------------- BOARD FUNCTIONS END -----------------------


    //---------------------- PLAYER FUNCTIONS START -----------------------

    increaseScore(player){
        player.scoresQueue.push(player.score);
        player.multiplier++;
        player.score += Server.baseScore + Server.multiplierScore * player.multiplier;
    }

    revertScore(player){
        player.score = player.scoresQueue.pop();
        player.multiplier--;
    }

    updateProgress(player, progress){
        player.progress = progress;
    }

    //---------------------- PLAYER FUNCTIONS END -----------------------

    getCardLetter(rank){
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

    playerAlreadyConnected(playerId){
        for (var i=0; i<this.players.length; i++)
            if (this.players[i].playerId == playerId)
                return true;

        return false;
    }

    getRandomCard(){
       return Math.floor(Math.random()*13) + 1;
    }


    arrayContainsInt(arr, x){
        for (var i=0; i<arr.length; i++){
            if (arr[i] == x)
                return true;
        }
        return false;
    }

}

export default Server;

Server.prototype.GAME_COMMAND_PLAYER_CONNECTED = "player_connected";
Server.prototype.GAME_COMMAND_RESIGN = "resign";
Server.prototype.GAME_COMMAND_TIMEOUT = "timeout";
Server.prototype.GAME_COMMAND_TRANSFER_CARD = "transferCard";
Server.prototype.GAME_COMMAND_REMOVE_WEB = "removeWeb";
Server.prototype.GAME_COMMAND_THROW_ICE = "throwIce";
Server.prototype.GAME_COMMAND_AWARD_BONUS = "awardBonus";
Server.prototype.GAME_COMMAND_BUY_MAGIC_WAND = "buyMagicWand";
Server.prototype.GAME_COMMAND_USE_MAGIC_WAND = "useMagicWand";
Server.prototype.GAME_COMMAND_EXTRA_CARDS = "extraCards";
Server.prototype.GAME_COMMAND_UNDO = "undo";
Server.prototype.GAME_COMMAND_SHUFFLE = "shuffle";

Server.prototype.STATUS_IDLE = "idle";
Server.prototype.STATUS_PLAYING = "playing";
Server.prototype.STATUS_FINISHING = "finishing";
Server.prototype.STATUS_FINISHED = "finished";

Server.mainHolder =  'MAIN_HOLDER';
Server.jokerHolder = 'JOKER_HOLDER';
Server.primarySaveHolder =  'PRIMARY_SAVE_HOLDER';
Server.secondarySaveHolder =  'SECONDARY_SAVE_HOLDER';
Server.boardHolder = 'BOARD_HOLDER';
Server.deckHolder = 'DECK_HOLDER';

Server.baseScore = 10;
Server.multiplierScore = 5;
Server.emptyBoardScore = 100;
Server.extraCardsPowerUp = 5;


Server.BONUS_EXTRA_CARDS = "ExtraCards";
Server.BONUS_CARD_REVEAL = "CardReveal";


