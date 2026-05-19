export function createWordRush({ WORDS, minigameContent, scoreEl, socket })
{
    let score = 0;

    const pool = WORDS.filter(w =>
        w.skill === "productief" &&
        w.direction === "nl-en"
    );

    let currentWord = null;

    const question = document.createElement("div");
    question.className = "minigame-question";

    const input = document.createElement("input");
    input.className = "minigame-input";
    input.placeholder = "Translate...";

    const submitBtn = document.createElement("button");
    submitBtn.className = "minigame-submit";
    submitBtn.textContent = "Submit";

    function nextWord() {
        currentWord = pool[Math.floor(Math.random() * pool.length)];

        question.textContent = `Translate: ${currentWord.nl}`;
        input.value = "";
        input.focus();
    }

    function submitAnswer()
    {
        const answer = input.value.trim().toLowerCase();
        const correct = answer === currentWord.en.toLowerCase();

        if (correct) {
            score++;
            scoreEl.textContent = `Score: ${score}`;
        } 

        socket.emit("MINIGAME_ANSWER", {
            playerId: socket.id,
            correct
        });

        nextWord();
    }

    submitBtn.onclick = submitAnswer;

    input.addEventListener("keydown", (e) =>
    {
        if (e.key === "Enter") submitAnswer();
    });

    minigameContent.appendChild(question);
    minigameContent.appendChild(input);
    minigameContent.appendChild(submitBtn);

    nextWord();

    return {
        stop() {
            submitBtn.onclick = null;
            minigameContent.innerHTML = "";
        }
    };
}