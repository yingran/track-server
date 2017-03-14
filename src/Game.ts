import {
    EVENT_COUNTDOWN,
    EVENT_START_GAME,
    EVENT_FINISH_GAME,
    EVENT_GAME_OVER,
    EVENT_PLAYER_ACTION,
    EVENT_RANK_LIST
} from "./Const";

/**
 * Game
 */

export default class Game {

    readonly socket: SocketIO.Socket;

    // room name
    public room: string;

    // player id
    public player: string;

    constructor( socket: SocketIO.Socket ) {
        this.socket = socket;

        this.socket.on( EVENT_PLAYER_ACTION, ( data: any ) => {
            this._handlePlayerAction( data );
        });

        this.socket.on( EVENT_FINISH_GAME, ( data: any ) => {
            this._handleFinishGame( data );
        });
    }

    private _handlePlayerAction( data: any ) {
        if ( !this.room ) {
            return;
        }
        data = JSON.parse( data );
        data = Object.assign( {
            "player": this.player
        }, data );
        data = JSON.stringify( data);
        this.socket.emit( EVENT_PLAYER_ACTION, data );
        this.socket.to( this.room ).emit( EVENT_PLAYER_ACTION, data );
    }

    private _handleFinishGame( data: any ) {
        data = JSON.parse( data );
        this.socket.emit( EVENT_FINISH_GAME, JSON.stringify( data ) );
        this.socket.to( this.room ).emit( EVENT_FINISH_GAME, JSON.stringify( data ) );
    }

    /**
     * 准备开始游戏
     * @description 房主触发，之后的countdown，start等需要进行房间广播
     */
    public ready() {
        this.countdown();
    }

    public countdown() {
        let count = 5;
        let interval = setInterval( ()=> {
            if ( count > 0 ) {
                let countData = JSON.stringify( {
                    "count": count
                } );
                this.socket.emit( EVENT_COUNTDOWN, countData );
                this.socket.to( this.room ).emit( EVENT_COUNTDOWN, countData );
                count--;
            } else {
                clearInterval( interval );
                this.start();
            }
        }, 1000 );
    }

    public start() {
        let data = JSON.stringify( {} );
        this.socket.emit( EVENT_START_GAME, data );
        this.socket.to( this.room ).emit( EVENT_START_GAME, data );
    }

    public over() {
        this.socket.emit( EVENT_GAME_OVER );
        this.socket.to( this.room ).emit( EVENT_GAME_OVER );
    }
    
}