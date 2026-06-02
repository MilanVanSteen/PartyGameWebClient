export function createRocketFuel({ WORDS, minigameContent, scoreEl, socket}) {
    let score = 0;
    let distance = 0;
    let currentWord = null;
    let stopped = false;

    // Filter words
    let pool = [];
    let deck = [];

    pool = WORDS.filter(w => w.nl && w.en && w.direction);
    deck = shuffle([...pool]);

    if (pool.length === 0) {
        minigameContent.innerHTML = "<p>No words found.</p>";
        return {
            stop() {
                stopped = true;
            }
        };
    }

    // -----------------------
    // Create UI
    // -----------------------
    const wrapper = document.createElement("div");
    wrapper.className = "rocket-fuel";

    const promptEl = document.createElement("div");
    promptEl.className = "rocket-question";

    const trackEl = document.createElement("div");
    trackEl.className = "rocket-track";

    const rocketEl = document.createElement("div");
    rocketEl.className = "rocket";
    rocketEl.textContent = "🚀";

    trackEl.appendChild(rocketEl);

    const optionsEl = document.createElement("div");
    optionsEl.className = "rocket-options";

    wrapper.appendChild(trackEl);
    wrapper.appendChild(promptEl);
    wrapper.appendChild(optionsEl);

    minigameContent.appendChild(wrapper);

    // -----------------------
    // Helpers
    // -----------------------
    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function updateScore() {
        scoreEl.textContent = `Score: ${score}`;
    }

    function updateRocket() {
        const percent = Math.min(distance, 150);
        rocketEl.style.left = `${percent}%`;
    }

    function getPrompt(word) {
        return word.language === "nl-en" ? word.nl : word.en;
    }

    function getCorrectAnswer(word) {
        return word.language === "nl-en" ? word.en : word.nl;
    }

    function nextQuestion() {
        if (stopped) return;

        // Refill deck when empty
        if (deck.length === 0) {
            deck = shuffle([...pool]);
        }
        
        // Pick random word
        currentWord = deck.pop();

        const correctAnswer = getCorrectAnswer(currentWord);

        // Get 3 random wrong answers
        const wrongAnswers = shuffle(
            pool
                .filter(w => getCorrectAnswer(w) !== correctAnswer && w.language === currentWord.language)
                .map(w => getCorrectAnswer(w))
        ).slice(0, 3);

        // Combine and shuffle options
        const options = shuffle([
            correctAnswer,
            ...wrongAnswers
        ]);

        // Render prompt
        promptEl.textContent = `Translate: ${getPrompt(currentWord)}`;

        // Render buttons
        optionsEl.innerHTML = "";

        options.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "rocket-option";
            btn.textContent = option;

            btn.onclick = () => submitAnswer(option);

            optionsEl.appendChild(btn);
        });
    }

    function submitAnswer(answer) {
        if (stopped) return;

        const correctAnswer = getCorrectAnswer(currentWord);
        const correct =
            answer.trim().toLowerCase() ===
            correctAnswer.trim().toLowerCase();

        if (correct) {
            score++;            
            distance += 2; // Move rocket forward
        } else if(!correct) {
            score = Math.max(0, score - 1);
            distance = Math.max(0, distance - 2); // Penalty
        }

        updateScore();
        updateRocket();

        socket.emit("MINIGAME_ANSWER", {
            playerId: socket.id,
            correct
        });

        nextQuestion();
    }

    // -----------------------
    // Initialize
    // -----------------------
    updateScore();
    updateRocket();
    nextQuestion();

    // -----------------------
    // Public API
    // -----------------------
    return {
        stop() {
            stopped = true;
        }
    };
}