// Config
const SERVER_URL = "https://partygameserver.up.railway.app/";
const socket = io(SERVER_URL);

// DOM
const joinScreen = document.getElementById("joinScreen");
const waitingScreen = document.getElementById("waitingScreen");
const gameScreen = document.getElementById("gameScreen");

const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const joinLog = document.getElementById("joinLog");
const playerList = document.getElementById("playerList");

// Helpers
function log(message) {
    joinLog.textContent += message + "\n";
    joinLog.scrollTop = joinLog.scrollHeight;
}

function showScreen(screen) {
    joinScreen.classList.add("hidden");
    waitingScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}

function updatePlayerList(players) {
    playerList.innerHTML = "";
    players.forEach((id, i) => {
        const li = document.createElement("li");
        li.textContent = `Player ${i+1} (${id.substring(0, 5)})`;
        playerList.appendChild(li);
    });
}

// Event Listeners
joinBtn.addEventListener("click", () => {
    const roomCode = roomInput.value.trim().toUpperCase();
    if (!roomCode) return alert("Enter room code!");
    socket.emit("JOIN_ROOM", { roomCode });
});

// Socket handlers
socket.on("connect", () => log(`✅ Connected with id ${socket.id}`));

socket.on("ROOM_JOINED", ({ roomCode, players }) => {
    log(`✅ Joined room ${roomCode}`);
    updatePlayerList(players);
    showScreen(waitingScreen);
});

socket.on("PLAYER_JOINED", ({ players }) => {
    log("👤 A new player joined");
    updatePlayerList(players);
});

socket.on("PLAYER_LEFT", ({ players }) => {
    log("👋 A player left");
    updatePlayerList(players);
});

socket.on("GAME_STARTED", () => {
    log("🚀 Game started!");
    showScreen(gameScreen);
});