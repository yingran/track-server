import * as http from "http";
import * as socket from "socket.io";

const server = http.createServer();
const io = socket( server );

io.on( "connection", ( socket )=> {
    socket.emit( "msg" , {
        "key": "value"
    });
    socket.disconnect();
});

server.listen( 3000 );