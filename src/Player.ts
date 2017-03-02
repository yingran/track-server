import Room from "./Room";
import {
    NAME_HALL,

    EVENT_JOIN_ROOM,
    EVENT_LEAVE_ROOM,
    EVENT_PLAYER_LIST
} from "./Const";

/**
 * Player
 */
export default class Player {
    
    readonly socket: SocketIO.Socket;
    readonly id: string;
    readonly name: string;

    constructor( socket: SocketIO.Socket, id: string, name: string ) {
        this.id = id;
        this.name = name;
        this.socket = socket;
    }

    private _leaveAllRooms() {
        let rooms = this.socket.rooms;
        for ( let key in rooms ) {
            this.socket.leave( key );
        }
    }

    /**
     * join room
     */
    public joinRoom( room: string ) {
        this._leaveAllRooms();
        this.socket.join( room );
        this.socket.emit( EVENT_JOIN_ROOM, JSON.stringify( { "room": room }) );
    }

    /**
     * leave room
     */
    public leaveRoom() {
        this._leaveAllRooms();
        this.socket.join( NAME_HALL );
        this.socket.emit( EVENT_LEAVE_ROOM );
    }

    
}