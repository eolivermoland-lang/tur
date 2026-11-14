import { addTrip, clothingAdvice, loadTrips, saveTrips } from './store.js';

const $ = selector => document.querySelector(selector);
let trips = loadTrips();
let latestWeather = null;
let steps = Number(localStorage.getItem('ut-pa-tur-steps') || 0);
let lastMotion = 0;
let lastMagnitude = 0;

$('#trip-date').value = new Date().toISOString().slice(0, 10);
$('#step-value').textContent = steps;

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === name));
  document.querySelectorAll('[data-go]').forEach(button => button.classList.toggle('active', button.dataset.go === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.go)));

function safeText(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function renderTrips() {
  const list = $('#trip-list');
  if (!trips.length) {
    list.innerHTML = '<p class="empty">Ingen steder ennå. Lagre den første fine plassen din.</p>';
    return;
  }
  list.innerHTML = trips.map(trip => `<article class="trip-item">${trip.image ? `<img src="${trip.image}" alt="Bilde fra ${safeText(trip.place)}" />` : '<div aria-hidden="true">📍</div>'}<div><strong>${safeText(trip.place)}</strong><time>${safeText(trip.date)}</time><p>${safeText(trip.note || 'Et godt sted å huske.')}</p></div></article>`).join('');
}

function getImage(file) {
  if (!file) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Bildet kunne ikke leses.'));
    reader.readAsDataURL(file);
  });
}

$('#trip-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  button.textContent = 'Lagrer …';
  try {
    const image = await getImage($('#trip-image').files[0]);
    trips = addTrip(trips, { place: $('#trip-place').value, date: $('#trip-date').value, note: $('#trip-note').value, image });
    saveTrips(trips);
    event.target.reset();
    $('#trip-date').value = new Date().toISOString().slice(0, 10);
    renderTrips();
    showScreen('diary');
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Lagre stedet';
  }
});

function weatherLabel(code) {
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return ['🌧️', 'Regn'];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['❄️', 'Snø'];
  if ([0, 1].includes(code)) return ['☀️', 'Klart'];
  if ([2, 3].includes(code)) return ['⛅', 'Skyet'];
  return ['☁︎', 'Litt skyer'];
}

function updateWeather(data, place = 'Her du er') {
  const current = data.current;
  const [icon, label] = weatherLabel(current.weather_code);
  const rain = current.precipitation > 0 || label === 'Regn';
  latestWeather = { temperature: Math.round(current.temperature_2m), rain, wind: current.wind_speed_10m };
  $('#weather-place').textContent = place;
  $('#weather-temp').textContent = `${latestWeather.temperature}°`;
  $('#weather-summary').textContent = `${label} · vind ${Math.round(latestWeather.wind)} m/s`;
  $('#weather-icon').textContent = icon;
  $('#clothing-advice').textContent = clothingAdvice(latestWeather);
  $('#sun-times').textContent = `Opp ${data.daily.sunrise[0].slice(11, 16)} · ned ${data.daily.sunset[0].slice(11, 16)}`;
  $('#wind-advice').textContent = latestWeather.wind >= 9 ? 'Det blåser: velg en skjermet rute og kle deg i lag.' : 'Lite vind: et godt tidspunkt for en rolig tur.';
  $('#fishing-advice').textContent = latestWeather.wind >= 9 ? 'For fiske: prøv en lun vik, eller vent til vinden roer seg.' : 'For fiske: rolig vind er ofte lettere fra land.';
  $('#weather-button').textContent = 'Oppdater været';
}

async function fetchWeather(position) {
  const { latitude, longitude } = position.coords;
  const endpoint = new URL('https://api.open-meteo.com/v1/forecast');
  endpoint.search = new URLSearchParams({ latitude, longitude, current: 'temperature_2m,precipitation,weather_code,wind_speed_10m', daily: 'sunrise,sunset', timezone: 'auto', forecast_days: '1' });
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error('Været kunne ikke hentes nå.');
  updateWeather(await response.json());
}

$('#weather-button').addEventListener('click', () => {
  $('#weather-button').textContent = 'Finner været …';
  if (!navigator.geolocation) {
    $('#weather-summary').textContent = 'Telefonen din kan ikke dele plassering.';
    return;
  }
  navigator.geolocation.getCurrentPosition(fetchWeather, () => {
    $('#weather-summary').textContent = 'Vi trenger plassering for været. Prøv igjen og trykk Tillat.';
    $('#weather-button').textContent = 'Prøv igjen';
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
});

function directionFor(degrees) {
  return ['Nord', 'Nordøst', 'Øst', 'Sørøst', 'Sør', 'Sørvest', 'Vest', 'Nordvest'][Math.round(degrees / 45) % 8];
}

function startCompass() {
  const listener = event => {
    const degrees = event.webkitCompassHeading ?? (360 - event.alpha) % 360;
    if (!Number.isFinite(degrees)) return;
    $('#compass-value').textContent = `${Math.round(degrees)}°`;
    $('#compass-direction').textContent = directionFor(degrees);
  };
  window.addEventListener('deviceorientation', listener, { passive: true });
  $('#compass-button').textContent = 'Kompasset er på';
  $('#compass-button').disabled = true;
}

$('#compass-button').addEventListener('click', async () => {
  try {
    if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') throw new Error('Du må tillate kompass.');
    }
    startCompass();
  } catch (error) {
    $('#compass-direction').textContent = error.message;
  }
});

function registerStep(event) {
  const acceleration = event.accelerationIncludingGravity;
  if (!acceleration) return;
  const magnitude = Math.sqrt((acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2);
  const now = Date.now();
  if (Math.abs(magnitude - lastMagnitude) > 1.2 && now - lastMotion > 300) {
    steps += 1;
    lastMotion = now;
    localStorage.setItem('ut-pa-tur-steps', steps);
    $('#step-value').textContent = steps;
  }
  lastMagnitude = magnitude;
}

$('#steps-button').addEventListener('click', async () => {
  try {
    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') throw new Error('Du må tillate bevegelse.');
    }
    window.addEventListener('devicemotion', registerStep, { passive: true });
    $('#step-status').textContent = 'Teller skritt mens denne siden er åpen.';
    $('#steps-button').textContent = 'Skritt teller';
    $('#steps-button').disabled = true;
  } catch (error) {
    $('#step-status').textContent = error.message;
  }
});

function addMessage(text, type) {
  const message = document.createElement('p');
  message.className = type === 'user' ? 'user-message' : 'assistant-message';
  message.textContent = text;
  $('#chat').append(message);
  $('#chat').scrollTop = $('#chat').scrollHeight;
}

$('#chat-form').addEventListener('submit', async event => {
  event.preventDefault();
  const input = $('#chat-input');
  const question = input.value.trim();
  if (!question) return;
  addMessage(question, 'user');
  input.value = '';
  input.disabled = true;
  try {
    const response = await fetch('/api/groq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Kunne ikke spørre turvennen.');
    addMessage(data.answer, 'assistant');
  } catch (error) {
    addMessage(`${error.message} AI blir tilgjengelig når nettsiden er publisert med den sikre API-innstillingen.`, 'assistant');
  } finally {
    input.disabled = false;
    input.focus();
  }
});

$('#install-help').addEventListener('click', () => $('#install-dialog').showModal());
$('.dialog-close').addEventListener('click', () => $('#install-dialog').close());

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
renderTrips();
