import { systemInstruction } from './instruction.js';

const chat = document.getElementById("chat");
const form = document.getElementById("input-form");
const input = document.getElementById("input");

const API_URL = 'https://paintings.eto-art.ru/chat';

let isNewSession = true;
let messages = [systemInstruction];

let sessionStartTime = Date.now();
let sessionActive = true;
let lastActiveTime = Date.now();
let totalActiveTime = 0;
let inactivityTimer = null;

function startInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (sessionActive) {
            sessionActive = false;
            const now = Date.now();
            totalActiveTime += now - lastActiveTime;
            console.log("⏸️ Сессия приостановлена из-за бездействия.");
        }
    }, 30000); // 30 секунд
}

function resumeSessionIfPaused() {
    if (!sessionActive) {
        sessionActive = true;
        lastActiveTime = Date.now();
        console.log("▶️ Сессия возобновлена.");
    } else {
        lastActiveTime = Date.now();
    }
    startInactivityTimer();
}

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
  // Обрабатываем жирный текст
  const bolded = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Если есть @, разбиваем текст на части ДО и ПОСЛЕ него
  const atIndex = bolded.indexOf('@');
  if (atIndex === -1) {
    return linkifyPart(bolded); // если @ нет — обрабатываем всё
  }

  const beforeAt = bolded.slice(0, atIndex);
  const afterAt = bolded.slice(atIndex); // включая сам @

  return linkifyPart(beforeAt) + afterAt;
}

function linkifyPart(text) {
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



async function logFullDeviceInfo() {
    const ua = navigator.userAgent;

    const uaLower = ua.toLowerCase();
    const platform = /android/.test(uaLower)
        ? 'Android'
        : /iphone|ipad|ipod/.test(uaLower)
        ? 'iOS'
        : /windows/.test(uaLower)
        ? 'Windows'
        : /mac/.test(uaLower)
        ? 'macOS'
        : 'Other';

    let browser = "Неизвестный браузер";
    if (ua.includes("YaBrowser")) {
        browser = "Яндекс.Браузер";
    } else if (ua.includes("OPR") || ua.includes("Opera")) {
        browser = "Opera";
    } else if (ua.includes("Edg")) {
        browser = "Microsoft Edge";
    } else if (ua.includes("Firefox")) {
        browser = "Mozilla Firefox";
    } else if (ua.includes("Chrome")) {
        browser = "Google Chrome";
    } else if (ua.includes("Safari")) {
        browser = "Safari";
    }

    const nowInMSK = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }));

    const enterTime = Date.now();

    window.addEventListener("beforeunload", () => {
        if (sessionActive) {
            totalActiveTime += Date.now() - lastActiveTime;
        }
        const totalSeconds = Math.floor(totalActiveTime / 1000);
        console.log(`Всего активного времени на сайте: ${totalSeconds} секунд`);
    });

    let ip = 'Не удалось получить';
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
    } catch (e) {
        console.warn("Ошибка при получении IP:", e);
    }

    console.log("📋 Информация об устройстве:");
    console.log("Платформа:", platform);
    console.log("Браузер:", browser);
    console.log("IP-адрес:", ip);
    console.log("Время захода (Москва):", nowInMSK.toLocaleString("ru-RU"));

    try {
        await fetch("https://paintings.eto-art.ru/device-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ip,
                platform,
                browser,
                enterTime: nowInMSK.toISOString(),
                deviceId 
            }),
        });
    } catch (err) {
        console.warn("Не удалось отправить deviceInfo:", err);
    }

    function handlePageExit() {
    const leaveTime = Date.now();
        if (sessionActive) {
        totalActiveTime += Date.now() - lastActiveTime;
    }
    const totalSeconds = Math.floor(totalActiveTime / 1000);

    navigator.sendBeacon("https://paintings.eto-art.ru/session-duration", JSON.stringify({
        ip,
        deviceId,
        duration_seconds: totalSeconds
    }));
    }

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            handlePageExit();
        }
    });

    window.addEventListener("pagehide", () => {
        handlePageExit();
    });
} 

logFullDeviceInfo();

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
    resumeSessionIfPaused();

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
                max_completion_tokens: 2000,
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
