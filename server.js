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
      players: [{id: socket.id, name, role: "Host"}]
    };
    socketToLobby[socket.id] = code;
    socket.emit('lobbyCreated', {code, role: "Host"});

    //lobbies[code].players.push({ id: socket.id, name });
    io.to(code).emit('updatePlayers', lobbies[code].players);
  });


  socket.on('joinLobby', ({ code, name }) => {
    code = code.toUpperCase();
    if (lobbies[code]) {
        socket.join(code);
        const role = (socket.id === lobbies[code].host) ? 'Host' : 'Player';
        lobbies[code].players.push({ id: socket.id, name, role: role });
        socketToLobby[socket.id] = code;

        socket.emit('lobbyJoined', {code, role});
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

    
  socket.on('startGame', () => {
    const code = socketToLobby[socket.id];
    const lobby = lobbies[code];

    if (!lobby || socket.id !== lobby.host) return;

    io.to(code).emit('gameStarted', lobbies[code].players);
  });


  socket.on("sendQuestions", (selections) => {
    const code = socketToLobby[socket.id];
    const players = lobbies[code].players.filter(p => p.id !== lobbies[code].host);

    players.forEach((player,i) => {
      const select = selections[i]
      io.to(player.id).emit("question", {question: select, name: player.name});
    });
  });


  socket.on("answer", ({answer, name}) => {
    const code = socketToLobby[socket.id];
    io.to(lobbies[code].host).emit("fetchAnswer", (name + ": " + answer));
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running");
});