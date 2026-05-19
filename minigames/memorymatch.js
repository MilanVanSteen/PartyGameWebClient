export function createMemoryMatch({ WORDS, minigameContent, scoreEl, socket }) {
    let score = 0;

    const pool = WORDS.filter(w =>
        w.skill === "productief" &&
        w.direction === "nl-en"
    ).sort(() => Math.random() - 0.5).slice(0, 6);

    const cards = [];

    pool.forEach(word => {
        cards.push({ id: word.id, value: word.en });
        cards.push({ id: word.id, value: word.nl });
    });

    cards.sort(() => Math.random() - 0.5);

    let firstCard = null;
    let lock = false;

    const grid = document.createElement("div");
    grid.classList.add("memory-grid");

    cards.forEach(cardData => {
        const card = document.createElement("button");

        card.textContent = "❓";
        card.dataset.id = cardData.id;
        card.dataset.value = cardData.value;
        card.dataset.flipped = "false";
        card.classList.add("memory-card");

        card.onclick = () => {
            if (lock || card.dataset.flipped === "true") return;

            card.textContent = cardData.value;
            card.dataset.flipped = "true";

            if (!firstCard) {
                firstCard = card;
                return;
            }

            if (firstCard.dataset.id === card.dataset.id) {
                firstCard.classList.add("matched");
                card.classList.add("matched");

                firstCard = null;

                score++;
                scoreEl.textContent = `Score: ${score}`;

                socket.emit("MINIGAME_ANSWER", {
                    playerId: socket.id,
                    correct: true
                });
            } 
            else {
                lock = true;

                setTimeout(() => {
                    card.textContent = "❓";
                    firstCard.textContent = "❓";

                    card.dataset.flipped = "false";
                    firstCard.dataset.flipped = "false";

                    firstCard = null;
                    lock = false;

                    socket.emit("MINIGAME_ANSWER", {
                        playerId: socket.id,
                        correct: false
                    });
                }, 700);
            }
        };

        grid.appendChild(card);
    });

    minigameContent.appendChild(grid);

    return {
        stop() {
            minigameContent.innerHTML = "";
        }
    };
}