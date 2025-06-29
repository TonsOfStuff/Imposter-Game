const socket = io();

function renderLobby(){
  if (currentRole === "Host"){
    document.getElementById('hostPanel').style.display = 'block';
    document.getElementById('playerPanel').style.display = 'none';
  }else{
    document.getElementById('hostPanel').style.display = 'none';
    document.getElementById('playerPanel').style.display = 'block';
  }
}


document.getElementById('startGameBtn').onclick = () => {
  socket.emit('startGame');
};

document.getElementById("sendButton").onclick = () => {
  const selections = Array.from(document.querySelectorAll(".questionInput")).map(input => input.value);
  document.querySelector("#hostGameScreen").childNodes.forEach(element => {
    element.remove();
  });
  socket.emit("sendQuestions", selections);
};

socket.on("question", (question) => {
  const gameScreen = document.getElementById("playerGameScreen")
  gameScreen.textContent = question;
  const answer = document.createElement("input");
  answer.placeholder = "Answer...";
  const answerButton = document.createElement("button");
  answerButton.innerText = "Submit"
  answerButton.addEventListener("click", () => {
    socket.emit("answer", answer.value);
  });

  gameScreen.appendChild(answer);
  gameScreen.appendChild(answerButton);
});

socket.on("fetchAnswer", (answer) => {
  const gameScreen = document.getElementById("hostGameScreen");
  gameScreen.innerText += answer;
  
})

socket.on("gameStarted", (players) => {
  document.getElementById('hostPanel').style.display = 'none';
  document.getElementById('playerPanel').style.display = 'none';

  if (currentRole === "Host") {
    const hostGameScreen = document.getElementById('hostGameScreen');
    hostGameScreen.style.display = 'block';
    players.forEach(player => {
      if (player["role"] !== "Host"){ 
        const newInput = document.createElement("input");
        newInput.className = "questionInput";
        newInput.placeholder = "Question for " + player.name;

        hostGameScreen.appendChild(newInput);
      }
    });
  } else {
    document.getElementById('playerGameScreen').style.display = 'block';
  }
})



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
let currentRole = '';

socket.on('lobbyCreated', ({code, role}) => {
  currentLobby = code;
  currentRole = role;
  document.getElementById('lobbyInfo').textContent = `Lobby Code: ${code}`;
  renderLobby();
});

socket.on('lobbyJoined', ({code, role}) => {
  currentLobby = code;
  currentRole = role;
  document.getElementById('lobbyInfo').textContent = `Joined Lobby: ${code}`;
  renderLobby();
});


let currentPlayers = [];
socket.on('updatePlayers', (players) => {
  currentPlayers = players;
  const ul = document.getElementById('players');
  ul.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name
    if (p.id === socket.id){
      li.textContent += " (you)";
    }else if (p.role === "Host"){
      li.textContent += " (Host)"
    }
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