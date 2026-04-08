// Config
const SERVER_URL = "https://partygame-gwgre4gjebg9h0fk.germanywestcentral-01.azurewebsites.net/";
const socket = io(SERVER_URL);

// DOM
const joinScreen = document.getElementById("joinScreen");
const roomInput = document.getElementById("roomInput");
const joinBtn = document.getElementById("joinBtn");

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

const bonusText = document.getElementById("bonusText");
const shieldText = document.getElementById("shieldText");
let addedStepsPending = false;
let shieldActive = false;

const powerupScreen = document.getElementById("powerupScreen");
const powerupTimerText = document.getElementById("powerupTimerText");
const powerupTimerFill = document.getElementById("powerupTimerFill");
let countdownInterval = null;
const powerupList = document.getElementById("powerupList");
const skipBtn = document.getElementById("skipPowerupBtn");

const minigameScreen = document.getElementById("minigameScreen");
const minigameTimerText = document.getElementById("minigameTimerText");
const minigameTimerFill = document.getElementById("minigameTimerFill");
let minigameInterval = null;
const minigameContent = document.getElementById("minigameContent");

// Helpers
function showScreen(screen) {
    joinScreen.classList.add("hidden");
    nameScreen.classList.add("hidden");
    waitingScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    powerupScreen.classList.add("hidden");
    minigameScreen.classList.add("hidden");

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

function startCountdown(duration) {

    let timeLeft = Math.floor(duration);

    powerupTimerText.textContent = timeLeft;
    powerupTimerFill.style.width = "100%";

    countdownInterval = setInterval(() => {
        timeLeft--;
        powerupTimerText.textContent = timeLeft;

        // Shrink bar
        const percent = (timeLeft / duration) * 100;

        powerupTimerFill.style.width = percent + "%";

        if (timeLeft <= 0) {
            stopCountdown();

            socket.emit("POWERUP_TIMER_FINISHED", { playerId: socket.id });
        }

    }, 1000);
}

function stopCountdown() {

    if (countdownInterval) 
    {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    powerupTimerFill.style.width = "0%";
}

function animateDiceRoll(finalRoll) {
    let intervalTime = 200;
    let elapsed = 0;
    const duration = 3000;

    const rollInterval = setInterval(() => {
        diceImage.src = diceImages[Math.floor(Math.random() * 6)];

        elapsed += intervalTime;
        if (elapsed > duration * 0.7) intervalTime = 150;
    }, intervalTime);
    
    setTimeout(() => {
        clearInterval(rollInterval);
        diceImage.src = diceImages[finalRoll-1];

        // Bounce effect
        diceImage.style.transition = 'transform 0.1s';
        diceImage.style.transform = 'scale(1.2)';
        setTimeout(() => diceImage.style.transform = 'scale(1)', 100);

        // Notify server when animation is done
        socket.emit("DICE_ROLL_FINISHED", { playerId: socket.id, roll: finalRoll });
    }, duration);
}

// Minigame
function startMinigameTimer(duration) {

    let timeLeft = Math.floor(duration);

    minigameTimerText.textContent = timeLeft;
    minigameTimerFill.style.width = "100%";

    minigameInterval = setInterval(() => {

        timeLeft--;

        minigameTimerText.textContent = timeLeft;

        const percent =
            (timeLeft / duration) * 100;

        minigameTimerFill.style.width =
            percent + "%";

        if (timeLeft <= 0) {

            stopMinigameTimer();

            socket.emit(
                "MINIGAME_FORCE_FINISH",
                {
                    playerId: socket.id,
                    correct: false
                }
            );
        }

    }, 1000);
}

function stopMinigameTimer() {
    if (minigameInterval) {
        clearInterval(minigameInterval);
        minigameInterval = null;
    }

    minigameTimerFill.style.width = "0%";
}

function loadMinigame(type)
{
    minigameContent.innerHTML = "";

    // Temp only game
    createTypingMinigame();

    // if (type === "TypingAnswer")
    // {
    //     createTypingMinigame();
    // }
}

function createTypingMinigame()
{
    const question = document.createElement("question");
    input.className = "minigame-question";
    question.textContent = "Translate: Apple";

    const input = document.createElement("input");
    input.className = "minigame-input";
    input.placeholder = "Type your answer...";

    const submitBtn = document.createElement("button");
    submitBtn.className = "minigame-submit";
    submitBtn.textContent = "Submit";

    submitBtn.onclick = () =>
    {
        stopMinigameTimer();

        const answer = input.value.trim().toLowerCase();
        const correct = answer === "appel";

        socket.emit(
            "MINIGAME_FINISHED",
            {
                playerId: socket.id,
                correct: correct
            }
        );

        showScreen(gameScreen);
    };

    minigameContent.appendChild(question);
    minigameContent.appendChild(input);
    minigameContent.appendChild(submitBtn);
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

skipBtn.onclick = () => {

    socket.emit("POWERUP_SKIPPED", {
        playerId: socket.id
    });

    showScreen(gameScreen);
};

// Socket handlers
socket.on("connect", () => log(`✅ Connected with id ${socket.id}`));

socket.on("ROOM_JOINED", ({ roomCode }) => {
    showScreen(nameScreen);
});

socket.on("NAME_ERROR", ({ message }) => {
    nameLog.textContent = message;
    nameLog.style.color = "red";
});

socket.on("PLAYER_JOINED", ({ players }) => {
    updatePlayerList(players);
    nameScreen.classList.add("hidden");
    showScreen(waitingScreen);
});

socket.on("PLAYER_LEFT", ({ players }) => {
    updatePlayerList(players);
});

socket.on("GAME_STARTED", () => {
    showScreen(gameScreen);
});

socket.on('DICE_ROLL_START', ({ roll }) => {
    animateDiceRoll(roll);
});

socket.on("POWERUP_PHASE_START", ({ inventory, duration }) => {
    // Remove +2 text
    if (addedStepsPending) {
        bonusText.classList.add("hidden");
        addedStepsPending = false;
    }

    showScreen(powerupScreen);

    powerupList.innerHTML = "";

    startCountdown(duration);

    // Auto skip if empty
    if (!inventory || inventory.length < 1) {

        socket.emit("POWERUP_SKIPPED", {
            playerId: socket.id
        });

        return;
    }

    inventory.forEach((powerup, index) => {

        const li = document.createElement("li");
        const btn = document.createElement("button");

        btn.textContent = powerup;

        btn.onclick = () => {
            // AddedSteps (locally)
            if (powerup === "AddedSteps") {
                addedStepsPending = true;
                bonusText.classList.remove("hidden");
            }

            // Shield (locally)
            if (powerup === "Shield") {
                shieldActive = true;
                shieldText.classList.remove("hidden");
            }

            socket.emit("POWERUP_SELECTED", {
                playerId: socket.id,
                inventoryIndex: index
            });

            showScreen(gameScreen);
        };

        li.appendChild(btn);
        powerupList.appendChild(li);
    });
});

socket.on("SHIELD_EXPIRED", () => {
    shieldActive = false;
    shieldText.classList.add("hidden");
});

socket.on("POWERUP_PHASE_END", () => {
    stopCountdown();
    showScreen(gameScreen);
});

socket.on("MINIGAME_START", ({ minigame, duration }) => {
    console.log("Starting minigame:", minigame);

    showScreen(minigameScreen);

    startMinigameTimer(duration);

    loadMinigame(minigame);
});

socket.on("MINIGAME_ENDED", () => {
    console.log("Minigame ended");

    stopMinigameTimer();

    showScreen(gameScreen);
});

