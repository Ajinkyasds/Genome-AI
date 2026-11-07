(function () {
    if (window.GenomeBotLoaded) return;
    window.GenomeBotLoaded = true;

    const scriptURL = document.currentScript.src;

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = new URL("./chat-widget.css", scriptURL).href;
    document.head.appendChild(css);

    // Markdown libraries
    const markedScript = document.createElement("script");
    markedScript.src =
        "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
    document.head.appendChild(markedScript);

    const purifierScript = document.createElement("script");
    purifierScript.src =
        "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js";
    document.head.appendChild(purifierScript);

    const savedState =
        sessionStorage.getItem("genomebot_open") === "true";

    let currentMode =
        sessionStorage.getItem("genomebot_mode") || "questions";

    if (!["questions", "explorer"].includes(currentMode)) {
        currentMode = "questions";
    }

    const container = document.createElement("div");
    container.id = "genomebot-container";

    container.innerHTML = `
        <button id="genomebot-launcher" aria-label="Open GenomeBot">
            🧬
        </button>

        <section id="genomebot-window" aria-label="GenomeBot assistant">

            <header class="gb-header">

                <div class="gb-profile">
                    <div class="gb-avatar">🧬</div>
                    <div>
                        <h3>GenomeBot</h3>
                        <span id="gb-subtitle">Your Scientific Companion</span>
                    </div>
                </div>

                <div class="gb-controls">
                    <button id="gb-minimize" aria-label="Minimize">−</button>
                    <button id="gb-close" aria-label="Close">×</button>
                </div>

            </header>

            <div class="gb-modebar">

                <button class="gb-mode-button"
                    data-mode="questions">
                    🔬 Questions
                </button>

                <button class="gb-mode-button"
                    data-mode="explorer">
                    🧭 Explorer
                </button>

            </div>

            <main class="gb-messages" id="gb-messages">

                <div class="gb-message gb-bot">
                    <p>Welcome to GenomeBot! 👋</p>
                    <p>Your companion for exploring the language of life.</p>
                    <p>Choose a mode above to begin your journey.</p>
                </div>

            </main>

            <div class="gb-suggestions" id="gb-suggestions"></div>

            <form id="gb-form">

                <input
                    type="text"
                    id="gb-input"
                    placeholder="Ask GenomeBot anything..."
                    autocomplete="off"
                    required
                >

                <button type="submit" aria-label="Send message">
                    ➤
                </button>

            </form>

            <footer class="gb-footer">
                Educational AI · Discover. Explore. Learn.
            </footer>

        </section>
    `;

    document.body.appendChild(container);

    const launcher =
        document.getElementById("genomebot-launcher");

    const chatWindow =
        document.getElementById("genomebot-window");

    const input =
        document.getElementById("gb-input");

    const messages =
        document.getElementById("gb-messages");

    const suggestions =
        document.getElementById("gb-suggestions");

    const subtitle =
        document.getElementById("gb-subtitle");

    const form =
        document.getElementById("gb-form");

    const modeButtons =
        document.querySelectorAll(".gb-mode-button");

    const API_URL =
        "https://genome-ai-1-o993.onrender.com/chat";

    let chatHistory = [];

    try {
        chatHistory = JSON.parse(
            sessionStorage.getItem("genomebot_history") || "[]"
        );
    } catch {
        chatHistory = [];
    }

    // MODE SUGGESTIONS

    const modeSuggestions = {

        questions: [
            "What is DNA?",
            "Explain genome sequencing",
            "What are mutations?"
        ],

        explorer: [
            "Guide me through this website",
            "Start a scientific mission",
            "What can I discover here?"
        ]

    };

    // MODE CONFIGURATION

    function updateMode() {

        sessionStorage.setItem(
            "genomebot_mode",
            currentMode
        );

        modeButtons.forEach(button => {

            button.classList.toggle(
                "gb-mode-active",
                button.dataset.mode === currentMode
            );

        });

        suggestions.innerHTML = "";

        modeSuggestions[currentMode].forEach(question => {

            const button = document.createElement("button");

            button.textContent = question;
            button.dataset.question = question;

            suggestions.appendChild(button);

            button.addEventListener("click", () => {

                input.value = question;
                input.focus();

            });

        });

        if (currentMode === "questions") {

            subtitle.textContent = "Scientific Learning Mode";

            input.placeholder =
                "Ask a scientific question...";

        } else {

            subtitle.textContent = "Website Explorer Mode";

            input.placeholder =
                "Where would you like to explore?";

        }

    }

    // SWITCH MODES

    modeButtons.forEach(button => {

        button.addEventListener("click", () => {

            const newMode = button.dataset.mode;

            if (newMode === currentMode) return;

            currentMode = newMode;

            updateMode();

            addMessage(
                currentMode === "questions"
                    ? "🔬 **Questions Mode activated!** Ask me anything about DNA, genetics, genomics and biotechnology."
                    : "🧭 **Explorer Mode activated!** I'll help you discover the different sections of this scientific website and guide you through learning missions.",
                "gb-bot"
            );

        });

    });

    // OPEN AND CLOSE CHAT

    function openChat() {

        chatWindow.classList.add("gb-visible");
        launcher.classList.add("gb-hidden");

        sessionStorage.setItem("genomebot_open", "true");

    }

    function closeChat() {

        chatWindow.classList.remove("gb-visible");
        launcher.classList.remove("gb-hidden");

        sessionStorage.setItem("genomebot_open", "false");

    }

    launcher.addEventListener("click", openChat);

    document.getElementById("gb-minimize")
        .addEventListener("click", closeChat);

    document.getElementById("gb-close")
        .addEventListener("click", closeChat);

    // DISPLAY MESSAGES

    function addMessage(text, sender) {

        const message = document.createElement("div");

        message.className = `gb-message ${sender}`;

        if (window.marked && window.DOMPurify) {

            const formattedHTML = marked.parse(text);

            message.innerHTML =
                DOMPurify.sanitize(formattedHTML);

        } else {

            message.textContent = text;

        }

        messages.appendChild(message);

        messages.scrollTop = messages.scrollHeight;

    }

    // RESTORE HISTORY

    if (chatHistory.length > 0) {

        messages.innerHTML = "";

        chatHistory.forEach(item => {

            addMessage(
                item.content,
                item.role === "user" ? "gb-user" : "gb-bot"
            );

        });

    }

    // SAVE HISTORY

    function saveHistory() {

        chatHistory = chatHistory.slice(-20);

        sessionStorage.setItem(
            "genomebot_history",
            JSON.stringify(chatHistory)
        );

    }

    // INITIALIZE MODE

    updateMode();

    if (savedState) openChat();

    // SEND MESSAGE

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const message = input.value.trim();

        if (!message) return;

        addMessage(message, "gb-user");

        const previousHistory = [...chatHistory];

        chatHistory.push({
            role: "user",
            content: message
        });

        saveHistory();

        input.value = "";
        input.disabled = true;

        const loading = document.createElement("div");

        loading.className =
            "gb-message gb-bot gb-thinking";

        loading.innerHTML = `
            <div class="gb-thinking-content">
                <span class="gb-thinking-label">
                    GenomeBot is thinking
                </span>

                <div class="gb-thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        messages.appendChild(loading);

        messages.scrollTop = messages.scrollHeight;

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    message: message,

                    history: previousHistory.slice(-12),

                    mode: currentMode

                })

            });

            const data = await response.json();

            loading.remove();

            if (!response.ok) {

                throw new Error(
                    data.detail || "AI request failed."
                );

            }

            addMessage(data.reply, "gb-bot");

            chatHistory.push({

                role: "assistant",

                content: data.reply

            });

            saveHistory();

        } catch (error) {

            loading.remove();

            addMessage(
                "Sorry! I couldn't connect to GenomeBot. Please try again.",
                "gb-bot"
            );

            console.error("GenomeBot error:", error);

        } finally {

            input.disabled = false;
            input.focus();

        }

    });

})();
