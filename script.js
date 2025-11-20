const input = document.querySelector("#cityInput");
const btn = document.querySelector("#searchBtn");
const loader = document.querySelector("#loader");
const result = document.querySelector("#result");
const errorBox = document.querySelector("#error");
const searchWrapper = document.querySelector("#searchWrapper");

const elCity = document.querySelector("#cityName");
const elTemp = document.querySelector("#temperature");
const elText = document.querySelector("#weatherText");
const elEmoji = document.querySelector("#weatherEmoji");
const elWind = document.querySelector("#wind");
const elHum = document.querySelector("#humidity");
const elTZ = document.querySelector("#timezone");
const elUpd = document.querySelector("#updated");
const elForecast = document.querySelector("#forecast");

const WEATHER = {
  0: { text: "Ясно", emoji: "☀️" },
  1: { text: "Преимущественно ясно", emoji: "🌤️" },
  2: { text: "Переменная облачность", emoji: "⛅" },
  3: { text: "Пасмурно", emoji: "☁️" },
  45: { text: "Туман", emoji: "🌫️" },   
  48: { text: "Изморозь", emoji: "🌫️" },
  51: { text: "Лёгкая морось", emoji: "🌦️" },
  53: { text: "Морось", emoji: "🌦️" },
  55: { text: "Сильная морось", emoji: "🌧️" },
  61: { text: "Лёгкий дождь", emoji: "🌦️" },
  63: { text: "Дождь", emoji: "🌧️" },
  65: { text: "Ливень", emoji: "🌧️" },
  71: { text: "Снег", emoji: "🌨️" },
  73: { text: "Снегопад", emoji: "❄️" },
  75: { text: "Сильный снег", emoji: "❄️" },
  80: { text: "Ливневый дождь", emoji: "🌧️" },
  95: { text: "Гроза", emoji: "⛈️" },
};

hideError();

btn.addEventListener("click", () => {
  const city = input.value.trim();
  hideError();

  if (!city) {
    showError("Введите город");
    return;
  }

  loadByCity(city);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btn.click();
});

// Скрываем ошибку при вводе текста
input.addEventListener("input", () => {
  hideError();
});

async function loadByCity(city) {
  try {
    toggleLoading(true);

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=ru&format=json`;

    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error("Ошибка геокодинга");

    const geoData = await geoRes.json();
    const place = geoData?.results?.[0];

    if (!place) {
      showError("Город не найден");
      return;
    }

    const { latitude, longitude, name, country, timezone } = place;

    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const wRes = await fetch(wUrl);
    if (!wRes.ok) throw new Error("Не удалось получить погоду");

    const wData = await wRes.json();

    renderCurrent(
      { name, country, timezone },
      wData.current,
      wData.timezone
    );
    renderForecast(wData.daily);
  } catch (err) {
    showError("Ошибка подключения к серверу");
  } finally {
    toggleLoading(false);
  }
}

function renderCurrent(place, current, tz) {
  elCity.textContent = `${place.name}, ${place.country}`;
  const wm = WEATHER[current.weather_code] || { text: "—", emoji: "❔" };

  elTemp.textContent = Math.round(current.temperature_2m) + "°C";
  elText.textContent = wm.text;
  elEmoji.textContent = wm.emoji;
  elWind.textContent = current.wind_speed_10m;
  elHum.textContent = current.relative_humidity_2m;
  elTZ.textContent = tz;
  elUpd.textContent = new Date().toLocaleString("ru-RU");

  result.classList.remove("hidden");
}

function renderForecast(daily) {
  elForecast.innerHTML = "";
  if (!daily.time) return;

  for (let i = 0; i < 5; i++) {
    const date = daily.time[i];
    const code = daily.weather_code[i];
    const wm = WEATHER[code] || { text: "—", emoji: "❔" };

    const dateStr = new Date(date).toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    elForecast.innerHTML += `
      <div class="day-card">
        <div class="day-date">${dateStr}</div>
        <div class="day-icon">${wm.emoji}</div>
        <div class="day-desc">${wm.text}</div>
        <div class="day-temp">${Math.round(daily.temperature_2m_max[i])}° 
          <span class="low">${Math.round(daily.temperature_2m_min[i])}°</span>
        </div>
      </div>
    `;
  }
}

function toggleLoading(v) {
  loader.classList.toggle("hidden", !v);
  if (v) result.classList.add("hidden");
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
  searchWrapper.classList.add("error");
  result.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
  errorBox.textContent = "";
  searchWrapper.classList.remove("error");
}

// Загружаем город по умолчанию
loadByCity("Bishkek");