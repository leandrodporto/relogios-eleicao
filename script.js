/*
 * CONFIGURAÇÃO
 * Altere apenas TARGET_DATE quando quiser mudar a data do evento.
 * Formato: YYYY-MM-DDTHH:mm:ss-03:00
 *
 * Exemplo:
 * 04 de outubro de 2026 às 08:00 em São Paulo:
 */
const TARGET_DATE = "2026-10-04T08:00:00-03:00";

const TIME_API =
  "https://timeapi.io/api/v1/timezone/zone?timeZone=America%2FSao_Paulo";

const $ = (id) => document.getElementById(id);

const currentTimeEl = $("currentTime");
const currentDateEl = $("currentDate");
const targetDateEl = $("targetDate");
const statusTextEl = $("statusText");

let serverNowMs = null;
let localSyncMs = null;

const pad = (value) => String(value).padStart(2, "0");

function formatTime(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTarget() {
  const target = new Date(TARGET_DATE);
  targetDateEl.textContent = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(target).replace(",", " às");
}

function getCurrentReference() {
  if (serverNowMs !== null && localSyncMs !== null) {
    return new Date(serverNowMs + (Date.now() - localSyncMs));
  }
  return new Date();
}

function renderCountdown(now) {
  const target = new Date(TARGET_DATE);
  let diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    diff = 0;
    $("days").textContent = "00";
    $("hours").textContent = "00";
    $("minutes").textContent = "00";
    $("seconds").textContent = "00";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  $("days").textContent = pad(days);
  $("hours").textContent = pad(hours);
  $("minutes").textContent = pad(minutes);
  $("seconds").textContent = pad(seconds);
}

function render() {
  const now = getCurrentReference();
  currentTimeEl.textContent = formatTime(now);
  currentDateEl.textContent =
    formatDate(now).charAt(0).toUpperCase() + formatDate(now).slice(1);
  renderCountdown(now);
}

async function syncTime() {
  try {
    const requestStarted = Date.now();

    const response = await fetch(TIME_API, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const requestFinished = Date.now();

    // O timestamp da API é a referência. Compensamos aproximadamente
    // metade do tempo de ida/volta da requisição.
    const networkDelay = (requestFinished - requestStarted) / 2;
    serverNowMs = new Date(data.local_time).getTime() + networkDelay;
    localSyncMs = requestFinished;

    statusTextEl.textContent = "Horário sincronizado com TimeAPI";
    render();
  } catch (error) {
    console.warn("Não foi possível sincronizar com a TimeAPI:", error);
    statusTextEl.textContent = "Usando o relógio local temporariamente";
    render();
  }
}

formatTarget();
syncTime();

// Atualiza a interface a cada segundo.
setInterval(render, 1000);

// Re-sincroniza periodicamente para reduzir qualquer desvio do relógio local.
setInterval(syncTime, 5 * 60 * 1000);
