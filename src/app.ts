import * as http from "http";
import * as socket from "socket.io";

import Room from "./Room";
import Player from "./Player";
import Game from "./Game";
import {
    EVENT_CREATE_PLAYER,
    EVENT_RENAME_PLAYER,

    EVENT_ENTER_HALL,
    EVENT_ROOM_LIST,
    EVENT_CREATE_ROOM,
    EVENT_JOIN_ROOM,
    EVENT_LEAVE_ROOM,

    EVENT_ENTER_GAME,

    NAME_HALL
} from "./Const";

const server = http.createServer();
const io = socket( server );


io.on( "connection", ( socket: SocketIO.Socket )=> {
    let player: Player;
    let room: Room;
    let game: Game;

    game = new Game( socket );
    
    socket.join( NAME_HALL );

    socket.on( EVENT_CREATE_PLAYER, ( data: any )=> {
        data = JSON.parse( data );
        player = new Player( socket, data["id"], data["name"] );
        game.player = player.id;
    });

    socket.on( EVENT_ENTER_HALL, ( data: any )=> {
        socket.emit( EVENT_ROOM_LIST , JSON.stringify( Room.getRoomList() ) );
    });

    socket.on( EVENT_CREATE_ROOM, ()=> {
        room = new Room();
        player.joinRoom( room.name );
        room.addPlayer( player );
        game.room = room.name;
    });

    socket.on( EVENT_JOIN_ROOM, ( data: any )=> {
        data = JSON.parse( data );
        room = Room.getRoomByName( data.room );
        player.joinRoom( room.name );
        room.addPlayer( player );
        game.room = room.name;
    });

    socket.on( EVENT_LEAVE_ROOM, ( data: any )=> {
        data = JSON.parse( data );
        room = Room.getRoomByName( data.room );
        if ( room ) {
            player.leaveRoom();
            room.removePlayer( player );
            room = null;
            game.room = null;
        }
    });

    socket.on( EVENT_ENTER_GAME, ( data: any ) => {
        if ( room && room.administrator && player.id === room.administrator.id ) {
            room.enterGame();
            game.ready();
        }
    });
});

server.listen( 8081 );