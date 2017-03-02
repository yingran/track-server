import {
    EVENT_COUNTDOWN,
    EVENT_START_GAME,
    EVENT_PLAY_OPERATION
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

        this.socket.on( EVENT_PLAY_OPERATION, ( data: any ) => {
            if ( !this.room ) {
                return;
            }
            data = JSON.parse( data );
            data = Object.apply( {
                "player": this.player
            }, data );
            this.socket.to( this.room ).emit( EVENT_PLAY_OPERATION, JSON.stringify( data) );
        });
    }

    public ready( player: string, room: string ) {
        this.room = room;
        this.player = player;

        this.countdown();
    }

    public countdown() {
        let count = 5;
        let interval = setInterval( ()=> {
            if ( count > 0 ) {
                this.socket.emit( EVENT_COUNTDOWN, JSON.stringify( {
                    "count": count
                } ) );
                count--;
            } else {
                clearInterval( interval );
                this.start();
            }
        }, 1000 );
    }

    public start() {
        this.socket.emit( EVENT_START_GAME, JSON.stringify( {} ) );
    }
}