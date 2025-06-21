const express = require('express');
const http = require("http");
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');  

const app = express();
const server = http.createServer(app); 
const io = new Server(server);       


app.use(express.static('public'));

const lobbies = {};
const socketToLobby = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createLobby', (name) => {
    const code = nanoid(6).toUpperCase();
    socket.join(code);
    lobbies[code] = {
      host: socket.id,
      players: [{id: socket.id, name}]
    };
    socket.emit('lobbyCreated', code);

    //lobbies[code].players.push({ id: socket.id, name });
    io.to(code).emit('updatePlayers', lobbies[code].players);
  });


  socket.on('joinLobby', ({ code, name }) => {
    code = code.toUpperCase();
    if (lobbies[code]) {
        socket.join(code);
        lobbies[code].players.push({ id: socket.id, name });
        socketToLobby[socket.id] = code;
        socket.emit('lobbyJoined', code);
        io.to(code).emit('updatePlayers', lobbies[code].players);
    } else {
        socket.emit('errorMsg', 'Lobby not found');
    }
    });


  socket.on('sendMessage', ({ code, message }) => {
    io.to(code).emit('receiveMessage', {
        id: socket.id,
        message
    });
  });



  socket.on('disconnect', () => {
    const code = socketToLobby[socket.id];
    if (code && lobbies[code]) {
        lobbies[code].players = lobbies[code].players.filter(p => p.id !== socket.id);
        io.to(code).emit('updatePlayers', lobbies[code].players);
        if (lobbies[code].players.length === 0) delete lobbies[code];
        delete socketToLobby[socket.id];
    }
    });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running");
});