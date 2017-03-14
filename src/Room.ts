import Player from "./Player";
import {
    NAME_HALL,

    EVENT_CREATE_ROOM,
    EVENT_JOIN_ROOM,
    EVENT_LEAVE_ROOM,
    EVENT_DESTROY_ROOM,
    EVENT_ROOM_LIST,
    EVENT_PLAYER_LIST,
    EVENT_ASSIGN_ADMINISTRATOR,
    EVENT_REVOKE_ADMINISTRATOR,
    EVENT_ENTER_GAME
} from "./Const";

/**
 * Room
 */

let _maxNameIndex = 1;
let _nextNameIndex = 0;

let _rooms: any = {};

export default class Room {
    
    readonly name: string;
    public administrator: Player;
    public players: any;
    public static MAX_PLAYER_COUNT: number = 5;

    constructor() {
        this.name = this._getName();
        this.players = {};
        _rooms[ this.name ] = this;
    }

    private _getName(): string {
        let prefix = "ROOM_";
        let name;
        if ( _nextNameIndex ) {
            name = `${prefix}${_nextNameIndex}`;
        } else {
            name = `${prefix}${_maxNameIndex++}`;
        }
        return name;
    }

    private _isEmpty() {
        let count: number = 0;
        for ( let key in this.players ) {
            count++;
        }
        return !count;
    }

    private _destroy( socket: SocketIO.Socket ) {
        _nextNameIndex = Number.parseInt( this.name.replace( /^ROOM_(\d)+$/gi, "$1" ) );
        delete _rooms[ this.name ];
        Room.emitRoomList( socket );
        this._revokeAdministrator();
    }
    

    private _getPlayerListData(): Array<any> {
        let players = this.players;
        let data = [];
        for ( let key in players ) {
            data.push( {
                "id": key,
                "name": players[ key ][ "name" ]
            } );
        }
        return data;
    }

    private _revokeAdministrator() {
        this.administrator.socket.emit( EVENT_REVOKE_ADMINISTRATOR );
        this.administrator = null;
    }

    public static getRoomByName( name: string ): Room {
        return _rooms[ name ];
    }

    public static getRoomList(): Array<string> {
        let data = [];
        for ( let key in _rooms ) {
            data.push( key );
        }
        return data;
    }

    public static emitRoomList( socket: SocketIO.Socket ): void {
        let dataRooms = JSON.stringify( Room.getRoomList() );
        socket.to( NAME_HALL ).emit( EVENT_ROOM_LIST, dataRooms );
        socket.emit( EVENT_ROOM_LIST, dataRooms );
    }

    public getPlayerCount (): number {
        return this._getPlayerListData().length;
    }

    public addPlayer( player: Player ) {
        let dataPlayers: string;
        if ( this._isEmpty() || this.administrator.id === player.id ) {
            this.administrator = player;
            this.administrator.socket.emit( EVENT_ASSIGN_ADMINISTRATOR );
            this.administrator.socket.to( NAME_HALL ).emit( EVENT_ROOM_LIST , JSON.stringify( Room.getRoomList() ));
        }

        this.players[ player.id ] = player;
        dataPlayers = JSON.stringify( this._getPlayerListData() );
        player.socket.emit( EVENT_PLAYER_LIST, dataPlayers );
        player.socket.to( this.name ).emit( EVENT_PLAYER_LIST, dataPlayers );
        if ( this.getPlayerCount() >= Room.MAX_PLAYER_COUNT ) {            
            Room.emitRoomList( player.socket );
        }
    }

    public removePlayer( player: Player ) {
        delete this.players[ player.id ];
        if ( this._isEmpty() ) {
            this._destroy( player.socket );
        } else {
            player.socket.to( this.name ).emit( EVENT_PLAYER_LIST, JSON.stringify( this._getPlayerListData() ) );
            if ( player === this.administrator ) {
                this._revokeAdministrator();
                for ( let key in this.players ) {
                    this.administrator = this.players[ key ];
                    break;
                }
                this.administrator.socket.emit( EVENT_ASSIGN_ADMINISTRATOR );
            }
            if ( this.getPlayerCount() === ( Room.MAX_PLAYER_COUNT - 1 ) ) {            
                Room.emitRoomList( player.socket );
            }
        }
    }

    public enterGame() {
        let players = this.players;
        let playerData = JSON.stringify( this._getPlayerListData() );
        this.administrator.socket.emit( EVENT_ENTER_GAME, playerData );
        this.administrator.socket.to( this.name ).emit( EVENT_ENTER_GAME, playerData );
        
        for ( let key in players ) {
            players[ key ].enterGame();
        }
    }    
}