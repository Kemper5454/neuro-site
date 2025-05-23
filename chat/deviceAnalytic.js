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
        const leaveTime = Date.now();
        const totalSeconds = Math.floor((leaveTime - enterTime) / 1000);
        console.log(`Всего времени на сайте: ${totalSeconds} секунд`);
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
}

logFullDeviceInfo();