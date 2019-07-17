import Controls from '../components/Controls';
import PlayerBox from '../components/PlayerBox';
import Server from '../components/Server';
import Levels from '../assets/data/SolitaireDuelslevels.json'
import Board from "../components/Board";

class GameScene extends Phaser.Scene {
    constructor(config) {
        super({
            key: 'GameScene'
        });

        this.state = {};
        this._started = false;
        this.myPos = -1;

        global.server.on('newState', (_state) => {
            this.onStateChanged(_state);

        });

    }

    preload(){
        this.levelsObj = this.load.json('Levels',Levels);
    }

    create() {
        console.log(" GameScene Create! ");

        global.server.Initialize( this.cache.json.get('Levels').levels );

        var config =  this.game.config;
        var ratio = config.width / config.height;

        var scaleY = window.innerHeight;
        var scaleX = ratio * window.innerHeight;

        console.log(config);
        console.log(config.width, config.height);
        console.log(scaleX, scaleY);

        // this.sys.game.resize(scaleX, scaleY);

        var levelBg = this.add.image(config.width*0.5, config.height*0.5, 'levelBg');
        levelBg.displayWidth = config.width;
        levelBg.scaleY = levelBg.scaleX;

        var theme =  this.add.sprite(config.width*0.5, 0, 'board1', 'theme');
        theme.displayWidth = config.width;
        theme.scaleY = theme.scaleX;
        theme.x = config.width*0.5;
        theme.y = config.height - theme.displayHeight*0.5;

        var controlsConfig = {
            scene: this,
            x: 0,
            y: 0,
            width: config.width,
            height: config.height,
            key : 'controls'
        }

        this.controls = new Controls(controlsConfig);

        this.playerBoxes = [];

        var playerBoxConfig1 = {
            scene: this,
            x: config.width*0.25,
            y: 0,
            key : 'playerBox1'
        }

        this.playerBox1 = new PlayerBox(playerBoxConfig1);
        this.playerBoxes.push(this.playerBox1);

        var playerBoxConfig2 = {
            scene: this,
            x: config.width*0.75,
            y: 0,
            key : 'playerBox2'
        }

        this.playerBox2 = new PlayerBox(playerBoxConfig2);
        this.playerBoxes.push(this.playerBox2);

        var boardConfig = {
            scene: this,
            x:0,
            y:0,
            width:config.width,
            height: config.height,
            key : 'board'
        }
        this.board = new Board(boardConfig);
        this.board.x = config.width*0.5;
        this.board.y = config.height*0.5;

        this.isMoving = false;
        this.isPendingResponse = false;
        this.hasMagicWand = false;

        this.connectPlayer();
    }

    connectPlayer(){
        var playerId = new Date().getMilliseconds();
        const playerName = global.randomNames[Math.floor(Math.random()*global.randomNames.length)] + "_" + playerId;
        console.log("player:"+playerName);
        this.playerData = {playerName:playerName, playerId: playerId};

        var playerConnedtRes = this.gameCommand(Server.prototype.GAME_COMMAND_PLAYER_CONNECTED, [ this.playerData]);
        console.log('Player '+ playerName + ' connected succesfuly? : '+playerConnedtRes);
    }

    onStateChanged(_state){
        this.state = _state;
        console.log('STATE CHANGE, status = '+_state.status);

        if (_state.status == Server.prototype.STATUS_PLAYING &&  this._started == false){
            console.log('YUPIIII GAME STARTED');
            this.Init();
            this._started = true;
        }

        if (!this._started) return;
        this.Sync();
    }

    Init(){
        for (var i = 0; i < this.state.players.length; i++)
        {
            if ( this.playerData.playerId == (this.state.players[i].playerId))
            {
                this.myPos = i;
            }
            this.playerBoxes[i].Init(this.state.players[i], this.state.boards[i].deckHolder.length);
        }

        console.log("I am "+this.playerData.playerName + " and my Pos is " + this.myPos);
        console.log("My deck has "+this.state.boards[this.myPos].deckHolder.length+" cards");
        this.controls.Init(this.state.boards[this.myPos], this.state.levelTime);
        this.board.Init(this.state.boards[this.myPos].slots, true);

    }

    Sync(){

    }

    gameCommand(cmd, params){
       return global.server.Command(cmd, this.myPos, this.playerData.playerId, params);
    }

    illegalWandUse(){
        console.log('Illegal Wand Use');
    }

    get IsMoving(){
        return this.isMoving;
    }

    set IsMoving(val){
        this.isMoving = val;
    }

    get IsPendingResponse(){
        return this.isPendingResponse;
    }

    set IsPendingResponse(val){
        console.log('>>>>>>>>>> MALAKA, isPendingResponse is being set to '+val);
        this.isPendingResponse = val;
    }

    get HasMagicWand(){
        return this.hasMagicWand;
    }

    set HasMagicWand(val){
        this.hasMagicWand = val;
    }

    get Controls() {
        return this.controls;
    }

    get Board() {
        return this.board;
    }



}

export default GameScene;
