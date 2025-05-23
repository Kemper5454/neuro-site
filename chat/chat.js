import { systemInstruction } from './instruction.js';

const chat = document.getElementById("chat");
const form = document.getElementById("input-form");
const input = document.getElementById("input");

const API_URL = 'https://paintings.eto-art.ru/chat';

let isNewSession = true;
let messages = [systemInstruction];

function addMessage(role, content) {
    const msg = document.createElement("div");
    msg.className = `message ${role}`;
    msg.innerHTML = linkify(content);
    document.querySelector('.chat-messages').appendChild(msg);

    const messageCount = document.querySelectorAll(".chat-messages .message").length;
    const chatContainer = document.getElementById("chat");
    if (messageCount === 0) {
        chatContainer.style.padding = "0";
    } else {
        chatContainer.style.padding = "1rem 1rem 2rem";
    }

    scrollToBottom();
}

function linkify(text) {
    const urlPattern = /(?:(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w./?=&%#-]*[\w/-])/gi;

    return text.replace(urlPattern, (match) => {
        const trailingPunctuation = /[.,!?;:)»"'’]+$/;
        const punctuation = match.match(trailingPunctuation);
        const cleanURL = match.replace(trailingPunctuation, '');

        const isFullURL = /^https?:\/\//i.test(cleanURL);
        const href = isFullURL ? cleanURL : '//' + cleanURL;

        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${cleanURL}</a>${punctuation ? punctuation[0] : ''}`;
    });
}

function getGPUInfo() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return "WebGL not supported";
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo
        ? {
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        }
        : "No GPU info available";
}

async function logDeviceInfo() {
    console.log("User-Agent:", navigator.userAgent);
    console.log("Platform:", navigator.platform);
    console.log("Language:", navigator.language);
    console.log("Cookies Enabled:", navigator.cookieEnabled);
    console.log("Screen Size:", screen.width + "x" + screen.height);
    console.log("Viewport Size:", window.innerWidth + "x" + window.innerHeight);
    console.log("Touch Supported:", 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    console.log("Is Mobile:", /Mobi|Android/i.test(navigator.userAgent));
    console.log("Local Time:", new Date().toString());

    const gpuInfo = getGPUInfo();
    console.log("GPU Info:", gpuInfo);

    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        console.log("Public IP:", data.ip);
    } catch (e) {
        console.log("IP fetch failed:", e);
    }
}

logDeviceInfo();

function getOrCreateDeviceId() {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('deviceId', id);
        console.log("🎉 Новый deviceId сгенерирован:", id);
    } else {
        console.log("🔑 Найден существующий deviceId:", id);
    }
    return id;
}

const deviceId = getOrCreateDeviceId();

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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-nano",
                messages,
                temperature: 0.5,
                max_tokens: 2000,
                newSession: isNewSession,
                deviceId
            })
        });

        hideLoading();

        if (!response.ok) {
            if (response.status === 429) {
                addMessage("assistant", "Превышен лимит сообщений, попробуйте завтра.");
            } else if (response.status === 500) {
                addMessage("assistant", "Попробуйте позже.");
            } else {
                addMessage("assistant", `Ошибка: ${response.status}`);
            }
            return;
        }

        const data = await response.json();
        console.log("Ответ сервера:", data);

        const reply = data.choices?.[0]?.message?.content || "[Ошибка в ответе]";
        addMessage("assistant", reply);
        messages.push({ role: "assistant", content: reply });

        isNewSession = false;

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
