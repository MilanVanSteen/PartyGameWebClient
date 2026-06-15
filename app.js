// Config
const SERVER_URL = "https://partygame-gwgre4gjebg9h0fk.germanywestcentral-01.azurewebsites.net/";
const socket = io(SERVER_URL);

import { WORDS } from "./words.js";
import { createWordRush } from "./minigames/wordRush.js";
import { createMemoryMatch } from "./minigames/memoryMatch.js";
import { createWordSnake } from "./minigames/wordSnake.js";
import { createRocketFuel } from "./minigames/rocketFuel.js";

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
const stuckText = document.getElementById("stuckText");
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
let minigameScore = 0;
const minigameScoreEl = document.getElementById("minigameScore");
let activeMinigame = null;

const instructionsEl = document.getElementById("minigameInstructions");

const endScreen = document.getElementById("endScreen");
const winnerText = document.getElementById("winnerText");

// Helpers
function showScreen(screen) {
    joinScreen.classList.add("hidden");
    nameScreen.classList.add("hidden");
    waitingScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    powerupScreen.classList.add("hidden");
    minigameScreen.classList.add("hidden");
    endScreen.classList.add("hidden");

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

        const percent = (timeLeft / duration) * 100;
        minigameTimerFill.style.width = percent + "%";

        if (timeLeft <= 0) {
            stopMinigameTimer();
            
            socket.emit("MINIGAME_TIMER_FINISHED", {
                playerId: socket.id
            });
        }

    }, 1000);
}

function stopMinigameTimer() {
    if (minigameInterval) 
    {
        clearInterval(minigameInterval);
        minigameInterval = null;
    }

    minigameTimerFill.style.width = "0%";
}

function clearMinigame() {
    stopMinigameTimer();

    minigameContent.innerHTML = "";
    instructionsEl.textContent = "";

    minigameScore = 0;
    minigameScoreEl.textContent = `Score: ${minigameScore}`;
}

function loadMinigame(type)
{
    if (activeMinigame?.stop) {
        activeMinigame.stop();
        activeMinigame = null;
    }

    switch (type)
    {
        case "WordRushNL":
            setMinigameInstructions(
                "Instructions: Type the English translation of the Dutch word as quickly as possible. Correct translation is +1 point, wrong translation a short penalty before the next word appears."
            );
            activeMinigame = createWordRush({
                WORDS,
                minigameContent,
                scoreEl: minigameScoreEl,
                socket,
                language: "nl-en"
            });
            setMinigameInstructions("Find as many Dutch words as you can!");
            break;

        case "WordRushEN":
            setMinigameInstructions(
                "Instructions: Type the Dutch translation of the English word as quickly as possible. Correct translation is +1 point, wrong translation a short penalty before the next word appears."
            );
            activeMinigame = createWordRush({
                WORDS,
                minigameContent,
                scoreEl: minigameScoreEl,
                socket,
                language: "en-nl"
            });
            break;

        case "MemoryMatch":
            setMinigameInstructions(
                "Instructions: Match the words with their translations by clicking on them. Correct matches are +1 point and won't turn back around."
            );
            activeMinigame = createMemoryMatch({
                WORDS,
                minigameContent,
                scoreEl: minigameScoreEl,
                socket
            });
            break;

        case "WordSnake":
            setMinigameInstructions(
                "Instructions: Use WASD or Arrow Keys to control the snake. Collect letters in the correct order of the word translated to spell the English translation. Correct letter is +1 point, wrong letter is -1 point."
            );
            activeMinigame = createWordSnake({
                socket,
                WORDS,
                minigameContent,
                scoreEl: minigameScoreEl,
                onAnswer: (data) => {
                    socket.emit("MINIGAME_ANSWER", {
                        playerId: socket.id,
                        ...data
                    });
                }
            });
            break;

        case "RocketFuel":
            setMinigameInstructions(
                "Instructions: Choose the correct translation to fuel your rocket and try to reach the finish line. Correct translation is +1 point, wrong translation is -1 point."
            );
            activeMinigame = createRocketFuel({
                WORDS,
                minigameContent,
                scoreEl: minigameScoreEl,
                socket
            });
            break;
        
        default:
            console.warn("Unknown minigame:", type);
            setMinigameInstructions(
                "Instructions: Use WASD or Arrow Keys to control the snake. Collect letters in the correct order of the word translated to spell the English translation. Correct letter is +1 point, wrong letter is -1 point."
            );
            activeMinigame = createWordSnake({
                socket,
                WORDS,
                minigameContent,
                scoreEl: minigameScoreEl,
                onAnswer: (data) => {
                    socket.emit("MINIGAME_ANSWER", {
                        playerId: socket.id,
                        ...data
                    });
                }
            });
            break;
    }
}

function setMinigameInstructions(text) {
    instructionsEl.textContent = text;
}

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
socket.on("connect", () =>{
    console.log(
        "✅ Connected with id",
        socket.id
    );
});

socket.on("ROOM_JOINED", ({ roomCode }) => {
    showScreen(nameScreen);
});

socket.on("NAME_ERROR", ({ message }) => {
    nameLog.textContent = message;
    nameLog.style.color = "red";
});

socket.on("NAME_CONFIRMED", () => {
    showScreen(waitingScreen);
});

socket.on("PLAYER_JOINED", ({ players }) => {
    updatePlayerList(players);
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

socket.on("SHOW_PLAYER_STUCK", ({ isStuck }) => {
    stuckText.classList.toggle("hidden", !isStuck);
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

    clearMinigame();

    showScreen(minigameScreen);

    stopMinigameTimer();
    startMinigameTimer(duration);

    loadMinigame(minigame);
});

socket.on("MINIGAME_ENDED", () => {
    console.log("Minigame ended");

    stopMinigameTimer();

    if (activeMinigame?.stop) {
        activeMinigame.stop();
        activeMinigame = null;
    }

    showScreen(gameScreen);
});

socket.on("GAME_ENDED", ({ winnerName }) => {
    console.log("Game ended. Winner:", winnerName);

    showScreen(endScreen);

    if (winnerText) {
        winnerText.textContent = `Winner: ${winnerName}`;
    }
});

socket.on("GAME_STOPPED", () => {
    console.log("Game ended by host");
    showLobby();
});
function showLobby() {
    // reset UI state
    showScreen(joinScreen);

    roomInput.value = "";
    nameInput.value = "";

    playerList.innerHTML = "";
}