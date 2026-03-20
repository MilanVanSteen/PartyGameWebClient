// Config
const SERVER_URL = "https://partygame-gwgre4gjebg9h0fk.germanywestcentral-01.azurewebsites.net/";
const socket = io(SERVER_URL);

// DOM
const joinScreen = document.getElementById("joinScreen");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");
const joinLog = document.getElementById("joinLog");

const nameScreen = document.getElementById("nameScreen");
const nameInput = document.getElementById("nameInput");
const nameBtn = document.getElementById("nameBtn");
const nameLog = document.getElementById("nameLog");

const waitingScreen = document.getElementById("waitingScreen");
const playerList = document.getElementById("playerList");

const gameScreen = document.getElementById("gameScreen");
const diceImage = document.getElementById("diceImage");
const diceImages = [
    "assets/dice/dice1.png",
    "assets/dice/dice2.png",
    "assets/dice/dice3.png",
    "assets/dice/dice4.png",
    "assets/dice/dice5.png",
    "assets/dice/dice6.png"
];

// Helpers
function log(message) {
    joinLog.textContent += message + "\n";
    joinLog.scrollTop = joinLog.scrollHeight;
}

function showScreen(screen) {
    joinScreen.classList.add("hidden");
    nameScreen.classList.add("hidden");
    waitingScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");

    screen.classList.remove("hidden");
}

function updatePlayerList(players) {
    playerList.innerHTML = "";

    players.forEach((player, i) => {
        const li = document.createElement("li");
        li.textContent = player.name
            ? player.name
            : `Player ${i + 1}`;
        playerList.appendChild(li);
    });
}

// Event Listeners
joinBtn.addEventListener("click", () => {
    const roomCode = roomInput.value.trim().toUpperCase();
    if (!roomCode) return alert("Enter room code!");

    socket.emit("JOIN_ROOM", { roomCode });
});

nameBtn.addEventListener("click", () => {
    const playerName = nameInput.value.trim();
    if (!playerName) return;

    socket.emit("SET_NAME", { playerName });
});

nameInput.addEventListener("input", () => {
    nameLog.textContent = "";
});

roomInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        joinBtn.click(); // Join on Enter-key
    }
});

nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        nameBtn.click(); // Continue on Enter-key
    }
});

// Socket handlers
socket.on("connect", () => log(`✅ Connected with id ${socket.id}`));

socket.on("ROOM_JOINED", ({ roomCode }) => {
    log(`Room ${roomCode} exists! Enter your name...`);
    showScreen(nameScreen);
});

socket.on("NAME_ERROR", ({ message }) => {
    nameLog.textContent = message;
    nameLog.style.color = "red";
});

socket.on("PLAYER_JOINED", ({ players }) => {
    log("👤 A new player joined");
    updatePlayerList(players);
    nameScreen.classList.add("hidden");
    showScreen(waitingScreen);
});

socket.on("PLAYER_LEFT", ({ players }) => {
    log("👋 A player left");
    updatePlayerList(players);
});

socket.on("GAME_STARTED", () => {
    log("🚀 Game started!");
    showScreen(gameScreen);
});

socket.on('DICE_ROLL_START', ({ roll }) => {
    let intervalTime = 200;
    let elapsed = 0;
    const duration = 3000;

    const rollInterval = setInterval(() => {
        diceImage.src = diceImages[Math.floor(Math.random() * 6)];

        // Slow down
        elapsed += intervalTime;
        if (elapsed > duration * 0.7) intervalTime = 150;
    }, intervalTime);
    
    setTimeout(() => {
        clearInterval(rollInterval);

        diceImage.src = diceImages[roll-1];

        // Bounce effect
        diceImage.style.transition = 'transform 0.1s';
        diceImage.style.transform = 'scale(1.2)';
        setTimeout(() => {
            diceImage.style.transform = 'scale(1)';
        }, 100);

        // Notify server when animation is done
        socket.emit("DICE_ROLL_FINISHED", { playerId: socket.id, roll });
    }, duration);
});

