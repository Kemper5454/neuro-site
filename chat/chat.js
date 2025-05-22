const chat = document.getElementById("chat");
const form = document.getElementById("input-form");
const input = document.getElementById("input");

const API_KEY = "sk-xq7wcUBqdHDCxyMwl4236oAmgc2XVpn3";
const API_URL = "https://api.proxyapi.ru/openai/v1/chat/completions";

let messages = [];

fetch('instruction.json')
    .then(response => response.json())
    .then(systemMessage => {
        messages.push(systemMessage);
    })
    .catch(error => {
        console.error("Не удалось загрузить системную инструкцию:", error);
        messages.push({
            role: "system",
            content: "Ты — маг, борешься со злом" // запасной вариант
        });
    });

function addMessage(role, content) {
    const msg = document.createElement("div");
    msg.className = `message ${role}`;
    msg.textContent = content;
    document.querySelector('.chat-messages').appendChild(msg);

    // Изменение padding в зависимости от количества сообщений
    const messageCount = document.querySelectorAll(".chat-messages .message").length;
    const chatContainer = document.getElementById("chat");
    if (messageCount === 0) {
        chatContainer.style.padding = "0";
    } else {
        chatContainer.style.padding = "1rem 1rem 2rem";
    }

    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById("chat");
    container.scrollTop = container.scrollHeight;
}

function showLoading() {
    const spinner = document.createElement("img");
    spinner.alt = "Загрузка...";
    spinner.className = "message assistant loading-spinner";
    spinner.id = "loading-spinner";
    document.querySelector('.chat-messages').appendChild(spinner);
    scrollToBottom();
}

function hideLoading() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) spinner.remove();
}

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    const scrollHeight = el.scrollHeight;
    const maxHeight = 200;

    if (scrollHeight > maxHeight) {
        el.style.height = maxHeight + 'px';
        el.style.overflowY = 'auto';
    } else {
        el.style.height = scrollHeight + 'px';
        el.style.overflowY = 'hidden';
    }
}

input.addEventListener("input", () => autoResizeTextarea(input));

input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const userMessage = input.value.trim();
        if (userMessage) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    addMessage("user", userMessage);
    messages.push({ role: "user", content: userMessage });
    input.value = "";
    autoResizeTextarea(input);

    showLoading();

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-nano",
                messages,
                temperature: 0.5,
                max_tokens: 2000
            })
        });

        const data = await response.json();
        hideLoading();

        const reply = data.choices?.[0]?.message?.content || "[Ошибка в ответе]";
        addMessage("assistant", reply);
        messages.push({ role: "assistant", content: reply });

    } catch (err) {
        hideLoading();
        console.error(err);
        addMessage("assistant", "Идёт плановое обновление! 🛠️ Сайт временно недоступен. Скоро вернёмся с улучшениями!");
    }
});

document.addEventListener('click', (event) => {
    const isChatOpen = chatContainer.classList.contains('mobile-expanded');
    const clickedInsideChat = chatContainer.contains(event.target);
    const clickedToggle = toggleBtn.contains(event.target);

    if (isMobile && isChatOpen && !clickedInsideChat && !clickedToggle) {
        chatContainer.classList.remove('mobile-expanded');
        toggleBtn.parentElement.classList.remove('hidden');
        closeBtn.classList.add('hidden');
        inputForm.style.display = 'none';
    }
});

const chatContainer = document.querySelector('.chat-container');
const toggleBtn = document.getElementById('expand-chat');
const closeBtn = document.getElementById('chat-close-button');
const inputForm = document.getElementById('input-form');
const isMobile = window.matchMedia("(max-width: 768px)").matches;

if (isMobile) {
    toggleBtn.addEventListener('click', () => {
        chatContainer.classList.add('mobile-expanded');
        toggleBtn.parentElement.classList.add('hidden');
        closeBtn.classList.remove('hidden');
        inputForm.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        chatContainer.classList.remove('mobile-expanded');
        toggleBtn.parentElement.classList.remove('hidden');
        closeBtn.classList.add('hidden');
        inputForm.style.display = 'none';
    });
}
