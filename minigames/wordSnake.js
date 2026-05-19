export function createWordSnake({ socket, WORDS, minigameContent, scoreEl, onAnswer}) {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    minigameContent.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    const GRID = 20;
    const SIZE = canvas.width / GRID;

    let score = 0;
    let running = true;

    const state = {
        snake: [{ x: 10, y: 10 }],
        dir: { x: 1, y: 0 },
        letters: []
    };

    function rand() {
        return Math.floor(Math.random() * GRID);
    }

    // pick word
    const pool = WORDS.filter(w =>
        w.skill === "productief" &&
        w.direction === "nl-en"
    );

    let word;
    let target;
    let display;
    let currentIndex = 0;
    let collected = [];

    // clue
    const clueEl = document.createElement("div");
    clueEl.classList.add("snake-clue");

    minigameContent.prepend(clueEl);

    // progress
    const progressEl = document.createElement("div");
    progressEl.classList.add("snake-progress");

    minigameContent.prepend(progressEl);

    function pickNewWord() {
        // Random word
        word = pool[Math.floor(Math.random() * pool.length)];
        target = word.en.replace(/ /g, "").split("");
        display = word.en.split("");
        currentIndex = 0;
        collected = [];

        clueEl.textContent = `Translate: ${word.nl}`;

        progressEl.textContent = renderProgress();

        spawnLetters();
    }

    // spawn letters
    function spawnLetters() {
        state.letters = [];

        const currentChar = target[currentIndex];

        // correct letters
        state.letters.push({
            x: rand(),
            y: rand(),
            char: currentChar,
            type: "correct"
        });

        // fake letters
        const alphabet = "abcdefghijklmnopqrstuvwxyz";

        for (let i = 0; i < 5; i++) {
            let fake;

            do {
                fake = alphabet[Math.floor(Math.random() * alphabet.length)];
            } while (fake === currentChar);

            state.letters.push({
                x: rand(),
                y: rand(),
                char: fake,
                type: "fake"
            });
        }
    }

    pickNewWord();

    // controls (IMPORTANT: only once)
    function keyHandler(e) {
        if (!running) return;

        switch (e.key) {
            case "w":
                if (state.dir.y === 1) break;
                state.dir = { x: 0, y: -1 };
                break;
            case "s":
                if (state.dir.y === -1) break;
                state.dir = { x: 0, y: 1 };
                break;
            case "a":
                if (state.dir.x === 1) break;
                state.dir = { x: -1, y: 0 };
                break;
            case "d":
                if (state.dir.x === -1) break;
                state.dir = { x: 1, y: 0 };
                break;
        }
    }

    document.addEventListener("keydown", keyHandler);

    function emit(correct) {
        socket.emit("MINIGAME_ANSWER", {
            playerId: socket.id,
            correct
        });

        onAnswer?.({ correct });
    }

    function update() {
        const head = {
            x: (state.snake[0].x + state.dir.x + GRID) % GRID,
            y: (state.snake[0].y + state.dir.y + GRID) % GRID
        };

        // move
        state.snake.unshift(head);

        let ate = false;

        for (let i = 0; i < state.letters.length; i++) {
            const l = state.letters[i];

            if (l.x === head.x && l.y === head.y) {

                if (l.type === "correct") {
                    currentIndex++;

                    collected.push(l.char);
                    
                    score++;
                    scoreEl.textContent = `Score: ${score}`;

                    emit(true);

                    progressEl.textContent = renderProgress();

                    ate = true;

                    if (currentIndex >= target.length) {
                        pickNewWord();
                    } else {
                        spawnLetters();
                    }
                } else {
                    emit(false);

                    score = Math.max(0, score - 1);
                    scoreEl.textContent = `Score: ${score}`;
                }

                break;
            }
        }

        if (!ate) {
            state.snake.pop();
        }
    }

    function renderProgress() {
        let result = [];
        let collectedIndex = 0;

        for (let i = 0; i < display.length; i++) {
            const char = display[i];

            if (char === " ") {
                result.push(" ");
            } else if (collectedIndex < collected.length) {
                result.push(collected[collectedIndex]);
                collectedIndex++;
            } else {
                result.push("_");
            }
        }

        return result.join(" ");
    }

    function draw() {
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // letters
        state.letters.forEach(l => {
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText(l.char, l.x * SIZE + 6, l.y * SIZE + 14);
        });

        // snake
        ctx.fillStyle = "white";
        state.snake.forEach(s => {
            ctx.fillRect(s.x * SIZE, s.y * SIZE, SIZE, SIZE);
        });
    }

    function loop() {
        if (!running) return;
        update();
        draw();
    }

    const interval = setInterval(loop, 140);

    function stop() {
        if (!running) return;

        running = false;
        clearInterval(interval);
        document.removeEventListener("keydown", keyHandler);

        minigameContent.innerHTML = "";
    }

    return { stop };
}