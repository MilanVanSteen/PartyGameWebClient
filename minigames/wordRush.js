export function createWordRush({ WORDS, minigameContent, scoreEl, socket, language })
{
    let score = 0;
    let locked = false;
    const PENALTY_TIME = 1500;

    // Words
    let pool = [];
    let deck = [];

    function initPool() {
        // Filter words based on language
        pool = WORDS.filter(w => w.direction === language && w.nl && w.en);
        deck = shuffle([...pool]);
    }
    initPool();

    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

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
        if (deck.length === 0) {
            deck = shuffle([...pool]); // fresh shuffled cycle
        }

        currentWord = deck.pop();

        if(language === "nl-en") {
            question.textContent = `Translate: ${currentWord.nl} (NL)`;
        }
        else if(language === "en-nl") {
            question.textContent = `Translate: ${currentWord.en} (EN)`;
        }
        input.value = "";
        input.focus();
    }

    function submitAnswer()
    {
        if (locked) return;

        const answer = input.value.trim().toLowerCase();
        let correct;
        
        if(language === "nl-en") {
            correct = answer === currentWord.en.toLowerCase();
        } else if(language === "en-nl") {
            correct = answer === currentWord.nl.toLowerCase();
        }

        if (correct) {
            score++;
            scoreEl.textContent = `Score: ${score}`;

            nextWord();
            
            // For this minigame no minus points, just lock input for a short time
            socket.emit("MINIGAME_ANSWER", {
                playerId: socket.id,
                correct
            });
        } 
        else{
            // Lock input and show penalty message
            locked = true;
            input.disabled = true;
            submitBtn.disabled = true;

            let answerToShow = "";
            if(language === "nl-en") {
                answerToShow = currentWord.en.toLowerCase();
            } else if(language === "en-nl") {
                answerToShow = currentWord.nl.toLowerCase();
            }

            question.textContent = `Wrong! - Correct answer: ${answerToShow}`;

            setTimeout(() => {
                locked = false;
                input.disabled = false;
                submitBtn.disabled = false;

                nextWord();
            }, PENALTY_TIME);
        }
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