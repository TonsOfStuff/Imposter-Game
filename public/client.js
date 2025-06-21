const socket = io();

document.getElementById('createBtn').onclick = () => {
const name = document.getElementById("nameInput").value.trim() || "Host";
  socket.emit('createLobby', name);
}

document.getElementById('joinBtn').onclick = () => {
  const code = document.getElementById('joinCode').value;
  const name = document.getElementById('nameInput').value.trim() || "Player";
  socket.emit('joinLobby', { code, name });
};

let currentLobby = '';

socket.on('lobbyCreated', (code) => {
  currentLobby = code;
  document.getElementById('lobbyInfo').textContent = `Lobby Code: ${code}`;
});

socket.on('lobbyJoined', (code) => {
  currentLobby = code;
  document.getElementById('lobbyInfo').textContent = `Joined Lobby: ${code}`;
});


let currentPlayers = [];
socket.on('updatePlayers', (players) => {
  currentPlayers = players;
  const ul = document.getElementById('players');
  ul.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name + (p.id === socket.id ? ' (you)' : '');
    ul.appendChild(li);
  });
});

socket.on('errorMsg', (msg) => {
  alert(msg);
});

document.getElementById('sendBtn').onclick = () => {
  const msg = document.getElementById('msgInput').value;
  socket.emit('sendMessage', { code: currentLobby, message: msg });
};

socket.on('receiveMessage', ({ id, message }) => {
  const sender = currentPlayers.find(p => p.id === id);
  const name = sender ? sender.name : id;
  const li = document.createElement('li');
  li.textContent = `${name}: ${message}`;
  document.getElementById('messages').appendChild(li);
});