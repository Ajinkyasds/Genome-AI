(function () {
    if (window.GenomeBotLoaded) return;
    window.GenomeBotLoaded = true;

    const css = document.createElement("link");
    css.rel = "stylesheet";
   css.href = new URL("./chat-widget.css", document.currentScript.src).href;
   // Markdown formatting libraries
const markedScript = document.createElement("script");
markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
document.head.appendChild(markedScript);

const purifierScript = document.createElement("script");
purifierScript.src = "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js";
document.head.appendChild(purifierScript);
    document.head.appendChild(css);

    const savedState = sessionStorage.getItem("genomebot_open") === "true";

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
                        <span>Genomics AI Assistant</span>
                    </div>
                </div>

                <div class="gb-controls">
                    <button id="gb-minimize" aria-label="Minimize">−</button>
                    <button id="gb-close" aria-label="Close">×</button>
                </div>
            </header>

            <main class="gb-messages" id="gb-messages">
                <div class="gb-message gb-bot">
                    <p>Hello! I'm GenomeBot. 👋</p>
                    <p>I'm here to help you explore DNA, genetics, genomics and bioinformatics.</p>
                    <p>What would you like to discover today?</p>
                </div>
            </main>

            <div class="gb-suggestions">
                <button data-question="What is DNA?">What is DNA?</button>
                <button data-question="Explain genome sequencing">Genome sequencing</button>
                <button data-question="What is a gene?">What is a gene?</button>
            </div>

            <form id="gb-form">
                <input
                    type="text"
                    id="gb-input"
                    placeholder="Ask GenomeBot anything..."
                    autocomplete="off"
                    required
                >
                <button type="submit" aria-label="Send message">➤</button>
            </form>

            <footer class="gb-footer">
                Educational AI · Verify important scientific information
            </footer>
        </section>
    `;

    document.body.appendChild(container);

    const launcher = document.getElementById("genomebot-launcher");
    const chatWindow = document.getElementById("genomebot-window");
    const minimize = document.getElementById("gb-minimize");
    const close = document.getElementById("gb-close");

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
    minimize.addEventListener("click", closeChat);
    close.addEventListener("click", closeChat);

    document.querySelectorAll(".gb-suggestions button").forEach(button => {
        button.addEventListener("click", () => {
            document.getElementById("gb-input").value = button.dataset.question;
            document.getElementById("gb-input").focus();
        });
    });

    if (savedState) openChat();

   // =====================================
// GENOMEBOT AI CONNECTION
// =====================================

const API_URL = "http://127.0.0.1:8000/chat";

const form = document.getElementById("gb-form");
const input = document.getElementById("gb-input");
const messages = document.getElementById("gb-messages");

let chatHistory = [];

try {
    chatHistory = JSON.parse(
        sessionStorage.getItem("genomebot_history") || "[]"
    );
} catch {
    chatHistory = [];
}

// Display a message
function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className = `gb-message ${sender}`;

    // Render Markdown when the libraries are loaded
    if (window.marked && window.DOMPurify) {

        const formattedHTML = marked.parse(text);

        message.innerHTML = DOMPurify.sanitize(formattedHTML);

    } else {

        // Safe fallback if libraries are still loading
        message.textContent = text;

    }

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;
}
// Restore previous conversation
if (chatHistory.length > 0) {

    messages.innerHTML = "";

    chatHistory.forEach(item => {
        addMessage(
            item.content,
            item.role === "user" ? "gb-user" : "gb-bot"
        );
    });
}

// Save conversation
function saveHistory() {

    chatHistory = chatHistory.slice(-20);

    sessionStorage.setItem(
        "genomebot_history",
        JSON.stringify(chatHistory)
    );
}

// Send message
form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const message = input.value.trim();

    if (!message) return;

    // Display user's message
    addMessage(message, "gb-user");

    const previousHistory = [...chatHistory];

    chatHistory.push({
        role: "user",
        content: message
    });

    saveHistory();

    input.value = "";
    input.disabled = true;

    // Show typing indicator
    const loading = document.createElement("div");
loading.className = "gb-message gb-bot gb-thinking";

loading.innerHTML = `
    <div class="gb-thinking-content">
        <span class="gb-thinking-label">GenomeBot is thinking</span>
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
                history: previousHistory.slice(-12)
            })

        });

        const data = await response.json();

        loading.remove();

        if (!response.ok) {
            throw new Error(data.detail || "AI request failed.");
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
            "Sorry! I couldn't connect to GenomeBot. Please check that the backend is running.",
            "gb-bot"
        );

        console.error("GenomeBot error:", error);

    } finally {

        input.disabled = false;
        input.focus();

    }

});
})();