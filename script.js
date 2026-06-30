
'use strict';

const API_KEY = '2ede3566c6c04c3207644baece96cc90';

const API_URLS = {
  weather:   (city)           => `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`,
  weatherGeo:(lat, lon)       => `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
  aqi:       (lat, lon)       => `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
  uvi:       (lat, lon)       => `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
  icon:      (iconCode)       => `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
};

const HISTORY_KEY   = 'weatherpulse_history';
const THEME_KEY     = 'weatherpulse_theme';
const MAX_HISTORY   = 8;

// Weather condition → CSS class mapping
const WEATHER_BACKGROUNDS = {
  'Clear':         'weather-sunny',
  'Clouds':        'weather-cloudy',
  'Rain':          'weather-rain',
  'Drizzle':       'weather-drizzle',
  'Thunderstorm':  'weather-thunder',
  'Snow':          'weather-snow',
  'Mist':          'weather-mist',
  'Smoke':         'weather-mist',
  'Haze':          'weather-mist',
  'Dust':          'weather-mist',
  'Fog':           'weather-mist',
  'Sand':          'weather-mist',
  'Ash':           'weather-mist',
  'Squall':        'weather-cloudy',
  'Tornado':       'weather-thunder',
};

// Weather condition → emoji mapping
const WEATHER_EMOJIS = {
  'Clear':        '☀️',
  'Clouds':       '☁️',
  'Rain':         '🌧️',
  'Drizzle':      '🌦️',
  'Thunderstorm': '⛈️',
  'Snow':         '❄️',
  'Mist':         '🌫️',
  'Smoke':        '🌫️',
  'Haze':         '🌫️',
  'Dust':         '🌫️',
  'Fog':          '🌫️',
  'Sand':         '🌫️',
  'Ash':          '🌋',
  'Squall':       '🌬️',
  'Tornado':      '🌪️',
};

// Wind direction mapping
const WIND_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
];

// AQI labels
const AQI_LABELS = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
const AQI_CLASSES = ['', 'aqi-good', 'aqi-fair', 'aqi-moderate', 'aqi-poor', 'aqi-very-poor'];

/* ============================================================
   STATE
   ============================================================ */

const state = {
  lastQuery:      null,  // last searched city name
  lastLat:        null,
  lastLon:        null,
  lastWeatherData:null,
  clockInterval:  null,
};

/* ============================================================
   DOM ELEMENT REFERENCES
   ============================================================ */

const $ = (id) => document.getElementById(id);
const $city        = $('city-input');
const $searchBtn   = $('search-btn');
const $locationBtn = $('location-btn');
const $clearInput  = $('clear-input-btn');
const $refreshBtn  = $('refresh-btn');
const $themeBtn    = $('theme-toggle-btn');
const $themeIcon   = $('theme-icon');
const $histSec     = $('history-section');
const $histChips   = $('history-chips');
const $clearHistBtn= $('clear-history-btn');
const $loadSec     = $('loading-section');
const $errSec      = $('error-section');
const $errEmoji    = $('error-emoji');
const $errTitle    = $('error-title');
const $errMsg      = $('error-message');
const $retryBtn    = $('retry-btn');
const $dashboard   = $('weather-dashboard');
const $emptyState  = $('empty-state');
const $copyBtn     = $('copy-btn');
const $shareBtn    = $('share-btn');
const $downloadBtn = $('download-btn');

/* ============================================================
   CLOCK & TIME UTILITIES
   ============================================================ */

/**
 * updateClock — Updates the navbar live clock every second
 */
function updateClock() {
  const now = new Date();

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  });

  const timeStr = now.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  $('nav-date').textContent = dateStr;
  $('nav-time').textContent = timeStr;
}

/**
 * formatUnixTime — Converts a Unix timestamp and timezone offset to local time string
 * @param {number} unixTs - Unix timestamp in seconds
 * @param {number} tzOffset - Timezone offset in seconds
 * @returns {string} Formatted time (e.g., "06:42 AM")
 */
function formatUnixTime(unixTs, tzOffset) {
  const utcMs  = (unixTs + tzOffset) * 1000;
  const date   = new Date(utcMs);
  const hh     = String(date.getUTCHours()).padStart(2, '0');
  const mm     = String(date.getUTCMinutes()).padStart(2, '0');
  const ampm   = +hh >= 12 ? 'PM' : 'AM';
  const hour12 = String(+hh % 12 || 12).padStart(2, '0');
  return `${hour12}:${mm} ${ampm}`;
}

/**
 * getWindDirection — Converts degrees to compass direction
 * @param {number} deg - Wind direction in degrees
 * @returns {string} Compass direction string
 */
function getWindDirection(deg) {
  const index = Math.round(deg / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

/**
 * calcDaylightDuration — Returns a human-readable daylight duration
 * @param {number} sunrise - Unix timestamp
 * @param {number} sunset - Unix timestamp
 * @returns {string} e.g., "13h 42m of daylight"
 */
function calcDaylightDuration(sunrise, sunset) {
  const diffSec = sunset - sunrise;
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  return `${h}h ${m}m of daylight`;
}

/* ============================================================
   API FUNCTIONS
   ============================================================ */

/**
 * fetchJSON — Generic fetch helper with error handling
 * @param {string} url
 * @returns {Promise<Object>} Parsed JSON
 */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

/**
 * getWeather — Fetches weather by city name
 * @param {string} city
 */
async function getWeather(city) {
  if (!city || !city.trim()) {
    showToast('⚠️ Please enter a city name', 'error');
    $city.focus();
    return;
  }

  state.lastQuery = city.trim();
  state.lastLat   = null;
  state.lastLon   = null;

  showLoading();
  hideError();
  hideDashboard();

  try {
    const data = await fetchJSON(API_URLS.weather(city));
    state.lastWeatherData = data;
    state.lastLat = data.coord.lat;
    state.lastLon = data.coord.lon;

    saveHistory(data.name);
    await displayWeather(data);
    changeBackground(data.weather[0].main);
    fetchAQI(data.coord.lat, data.coord.lon);
    fetchUVI(data.coord.lat, data.coord.lon);

  } catch (err) {
    handleWeatherError(err);
  } finally {
    hideLoading();
  }
}

/**
 * getWeatherByCoords — Fetches weather by lat/lon
 * @param {number} lat
 * @param {number} lon
 */
async function getWeatherByCoords(lat, lon) {
  state.lastLat   = lat;
  state.lastLon   = lon;
  state.lastQuery = null;

  showLoading();
  hideError();
  hideDashboard();

  try {
    const data = await fetchJSON(API_URLS.weatherGeo(lat, lon));
    state.lastWeatherData = data;

    saveHistory(data.name);
    await displayWeather(data);
    changeBackground(data.weather[0].main);
    fetchAQI(lat, lon);
    fetchUVI(lat, lon);

  } catch (err) {
    handleWeatherError(err);
  } finally {
    hideLoading();
  }
}

/**
 * fetchAQI — Fetches Air Quality Index data
 * @param {number} lat
 * @param {number} lon
 */
async function fetchAQI(lat, lon) {
  try {
    const data  = await fetchJSON(API_URLS.aqi(lat, lon));
    const aqi   = data.list[0].main.aqi;
    const label = AQI_LABELS[aqi] || '—';
    const cls   = AQI_CLASSES[aqi] || '';

    const $aqiVal   = $('aqi-value');
    const $aqiLabel = $('aqi-label');

    $aqiVal.textContent   = aqi;
    $aqiVal.className     = `stat-value ${cls}`;
    $aqiLabel.textContent = label;
  } catch {
    $('aqi-value').textContent = '—';
  }
}

/**
 * fetchUVI — Fetches UV Index data
 * @param {number} lat
 * @param {number} lon
 */
async function fetchUVI(lat, lon) {
  try {
    const data = await fetchJSON(API_URLS.uvi(lat, lon));
    const uvi  = data.value;
    let uviText;

    if      (uvi <= 2)  uviText = `${uvi} (Low)`;
    else if (uvi <= 5)  uviText = `${uvi} (Moderate)`;
    else if (uvi <= 7)  uviText = `${uvi} (High)`;
    else if (uvi <= 10) uviText = `${uvi} (Very High)`;
    else                uviText = `${uvi} (Extreme)`;

    $('uv-index').textContent = uviText;
  } catch {
    $('uv-index').textContent = '—';
  }
}

/* ============================================================
   DISPLAY FUNCTIONS
   ============================================================ */

/**
 * displayWeather — Populates all weather data into the DOM
 * @param {Object} data - OpenWeatherMap weather response
 */
async function displayWeather(data) {
  const {
    name,
    sys,
    weather,
    main,
    wind,
    visibility,
    timezone,
  } = data;

  const condition = weather[0];
  const tzOffset  = timezone; // seconds

  // --- Location ---
  $('city-name').textContent    = name;
  $('country-name').textContent = `${getFlag(sys.country)} ${sys.country}`;
  $('local-time').textContent   = `Local time: ${formatUnixTime(Math.floor(Date.now() / 1000), tzOffset)}`;

  // --- Weather icon & emoji ---
  const iconUrl = API_URLS.icon(condition.icon);
  const iconEl  = $('weather-icon-main');
  iconEl.innerHTML = `<img src="${iconUrl}" alt="${condition.description}" width="80" height="80" />`;

  $('weather-emoji').textContent = WEATHER_EMOJIS[condition.main] || '🌈';

  // --- Main temperature ---
  const temp     = Math.round(main.temp);
  const $tempEl  = $('temperature');
  $tempEl.textContent = temp;
  applyTempColor($tempEl, temp);

  $('weather-condition').textContent = condition.description;
  $('feels-like').textContent        = `Feels like ${Math.round(main.feels_like)}°C`;

  // --- Min / Max ---
  $('min-val').textContent = Math.round(main.temp_min);
  $('max-val').textContent = Math.round(main.temp_max);

  // --- Stat cards ---
  $('humidity').textContent  = `${main.humidity}%`;
  $('humidity-bar').style.width = `${main.humidity}%`;

  $('pressure').textContent  = `${main.pressure} hPa`;

  const windSpeedKmh = (wind.speed * 3.6).toFixed(1);
  $('wind-speed').textContent        = `${windSpeedKmh} km/h`;
  $('wind-speed-detail').textContent = `${windSpeedKmh} km/h`;
  $('wind-gust').textContent         = wind.gust ? `${(wind.gust * 3.6).toFixed(1)} km/h` : '—';

  const windDir = getWindDirection(wind.deg);
  $('wind-direction-text').textContent = windDir;
  $('wind-degrees').textContent        = `${wind.deg}°`;
  $('compass-dir').textContent         = windDir;
  $('compass-needle').style.transform  = `rotate(${wind.deg}deg)`;
  $('wind-compass').title              = `Wind from ${windDir}`;

  const visMeter = visibility !== undefined ? `${(visibility / 1000).toFixed(1)} km` : '—';
  $('visibility').textContent = visMeter;

  // --- Sunrise / Sunset ---
  const sunriseStr = formatUnixTime(sys.sunrise, tzOffset);
  const sunsetStr  = formatUnixTime(sys.sunset,  tzOffset);

  $('sunrise').textContent        = sunriseStr;
  $('sunset').textContent         = sunsetStr;
  $('sun-rise-label').textContent = sunriseStr;
  $('sun-set-label').textContent  = sunsetStr;
  $('daylight-duration').textContent = calcDaylightDuration(sys.sunrise, sys.sunset);

  // --- Sun arc animation ---
  animateSunArc(sys.sunrise, sys.sunset);

  // --- Today's summary ---
  $('summary-text').textContent = buildWeatherSummary(data);

  // Show dashboard
  $emptyState.style.display   = 'none';
  $dashboard.style.display    = 'grid';
  $dashboard.style.animation  = 'none';
  void $dashboard.offsetWidth; // reflow to restart animation
  $dashboard.style.animation  = '';

  // Update history chips
  loadHistory();
}

/**
 * applyTempColor — Colors the temperature element based on value
 * @param {HTMLElement} el
 * @param {number} temp
 */
function applyTempColor(el, temp) {
  el.classList.remove('temp-hot', 'temp-warm', 'temp-mild', 'temp-cold');
  if      (temp > 35) el.classList.add('temp-hot');
  else if (temp > 20) el.classList.add('temp-warm');
  else if (temp > 10) el.classList.add('temp-mild');
  else                el.classList.add('temp-cold');
}

/**
 * buildWeatherSummary — Generates a human-readable summary paragraph
 * @param {Object} data
 * @returns {string}
 */
function buildWeatherSummary(data) {
  const { name, sys, weather, main, wind, visibility } = data;
  const condition  = weather[0];
  const temp       = Math.round(main.temp);
  const humidity   = main.humidity;
  const windKmh    = (wind.speed * 3.6).toFixed(1);
  const visKm      = visibility ? (visibility / 1000).toFixed(1) : null;

  const emoji = WEATHER_EMOJIS[condition.main] || '';
  const flag  = getFlag(sys.country);

  let summary = `${emoji} ${name}, ${flag} is currently experiencing ${condition.description} `;
  summary += `with a temperature of ${temp}°C (feels like ${Math.round(main.feels_like)}°C). `;
  summary += `Humidity is at ${humidity}% and winds are blowing at ${windKmh} km/h `;
  summary += `from the ${getWindDirection(wind.deg)}. `;
  if (visKm) summary += `Visibility is ${visKm} km. `;
  summary += `High of ${Math.round(main.temp_max)}°C and low of ${Math.round(main.temp_min)}°C expected today.`;

  return summary;
}

/**
 * animateSunArc — Draws the sun position on the arc based on current time
 * @param {number} sunriseTs
 * @param {number} sunsetTs
 */
function animateSunArc(sunriseTs, sunsetTs) {
  const nowTs = Math.floor(Date.now() / 1000);

  // Clamp progress between 0 and 1
  const progress = Math.min(1, Math.max(0, (nowTs - sunriseTs) / (sunsetTs - sunriseTs)));

  // Arc: M 20 150 Q 150 10 280 150
  // Parametric point on quadratic bezier at t=progress
  const t  = progress;
  const p0 = { x: 20,  y: 150 };
  const p1 = { x: 150, y: 10  };
  const p2 = { x: 280, y: 150 };

  const x = (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x;
  const y = (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y;

  const $dot = $('sun-position-dot');
  if ($dot) {
    $dot.setAttribute('cx', x.toFixed(1));
    $dot.setAttribute('cy', y.toFixed(1));
  }

  // Arc progress stroke-dasharray trick
  const arcLen = 350; // approximate arc length
  const $arcProg = $('sun-arc-progress');
  if ($arcProg) {
    $arcProg.style.strokeDasharray  = `${(progress * arcLen).toFixed(0)} ${arcLen}`;
  }
}

/**
 * changeBackground — Sets the body weather class for background gradient
 * @param {string} condition - e.g., 'Clear', 'Rain'
 */
function changeBackground(condition) {
  const ALL_WEATHER_CLASSES = Object.values(WEATHER_BACKGROUNDS);
  document.body.classList.remove(...ALL_WEATHER_CLASSES);

  // Night mode: check if current UTC hour is between 20:00 and 5:00
  const utcHour = new Date().getUTCHours();
  const isNight = utcHour >= 20 || utcHour < 5;

  if (isNight && condition === 'Clear') {
    document.body.classList.add('weather-night');
  } else {
    const cls = WEATHER_BACKGROUNDS[condition] || 'weather-sunny';
    document.body.classList.add(cls);
  }
}

/* ============================================================
   UI UTILITY FUNCTIONS
   ============================================================ */

/**
 * showLoading — Shows the loading spinner
 */
function showLoading() {
  $loadSec.style.display  = 'block';
  $emptyState.style.display = 'none';
}

/**
 * hideLoading — Hides the loading spinner
 */
function hideLoading() {
  $loadSec.style.display = 'none';
}

/**
 * showError — Displays an animated error card
 * @param {string} emoji
 * @param {string} title
 * @param {string} message
 */
function showError(emoji, title, message) {
  $errEmoji.textContent   = emoji;
  $errTitle.textContent   = title;
  $errMsg.textContent     = message;
  $errSec.style.display   = 'block';

  // Restart animation
  $errEmoji.style.animation = 'none';
  void $errEmoji.offsetWidth;
  $errEmoji.style.animation = '';
}

/**
 * hideError — Hides the error card
 */
function hideError() {
  $errSec.style.display = 'none';
}

/**
 * hideDashboard — Hides the weather dashboard
 */
function hideDashboard() {
  $dashboard.style.display = 'none';
}

/**
 * handleWeatherError — Maps fetch errors to friendly UI messages
 * @param {Error} err
 */
function handleWeatherError(err) {
  if (!navigator.onLine) {
    showError('🌐', 'No Internet Connection', 'Please check your network and try again.');
  } else if (err.status === 404) {
    showError('❌', 'City Not Found', `We couldn't find "${state.lastQuery || 'that location'}". Please check the spelling and try again.`);
  } else if (err.status === 401) {
    showError('🔑', 'Invalid API Key', 'Please add a valid OpenWeatherMap API key in script.js.');
  } else if (err.status === 429) {
    showError('⏳', 'Rate Limit Reached', 'Too many requests. Please wait a moment and try again.');
  } else {
    showError('⚠️', 'API Error', `Something went wrong: ${err.message}. Please try again.`);
  }
}

/**
 * showToast — Displays a temporary toast notification
 * @param {string} message
 * @param {'info'|'success'|'error'} type
 * @param {number} duration - ms
 */
function showToast(message, type = 'info', duration = 3500) {
  const $container = $('toast-container');
  const toast      = document.createElement('div');
  toast.className  = `toast toast-${type}`;
  toast.textContent = message;
  $container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/**
 * getFlag — Returns a country flag emoji from country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 (e.g., "US")
 * @returns {string} Flag emoji
 */
function getFlag(countryCode) {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('');
}

/* ============================================================
   DARK MODE
   ============================================================ */

/**
 * toggleDarkMode — Switches between light/dark themes with animation
 */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle('theme-dark');
  document.body.classList.toggle('theme-light', !isDark);
  $themeBtn.setAttribute('aria-pressed', isDark.toString());
  $themeIcon.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info', 2000);
}

/**
 * loadTheme — Restores saved theme preference on startup
 */
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    document.body.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
    $themeBtn.setAttribute('aria-pressed', 'true');
    $themeIcon.textContent = '☀️';
  }
}

/* ============================================================
   SEARCH HISTORY
   ============================================================ */

/**
 * saveHistory — Adds a city to localStorage history
 * @param {string} city
 */
function saveHistory(city) {
  const history = getHistoryData();
  const filtered = history.filter(c => c.toLowerCase() !== city.toLowerCase());
  filtered.unshift(city);
  const trimmed = filtered.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  loadHistory();
}

/**
 * getHistoryData — Returns history array from localStorage
 * @returns {string[]}
 */
function getHistoryData() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * loadHistory — Renders history chips from localStorage
 */
function loadHistory() {
  const history = getHistoryData();

  if (history.length === 0) {
    $histSec.style.display = 'none';
    return;
  }

  $histSec.style.display = 'block';
  $histChips.innerHTML   = '';

  history.forEach((city) => {
    const chip = document.createElement('button');
    chip.className      = 'history-chip';
    chip.textContent    = `🌍 ${city}`;
    chip.setAttribute('role', 'listitem');
    chip.setAttribute('aria-label', `Search weather for ${city}`);
    chip.addEventListener('click', () => {
      $city.value = city;
      getWeather(city);
    });
    $histChips.appendChild(chip);
  });
}

/**
 * clearHistory — Removes all history from localStorage
 */
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  $histSec.style.display = 'none';
  $histChips.innerHTML   = '';
  showToast('🗑️ Search history cleared', 'info', 2000);
}

/* ============================================================
   GEOLOCATION
   ============================================================ */

/**
 * searchByLocation — Uses Geolocation API to fetch user's position
 */
function searchByLocation() {
  if (!navigator.geolocation) {
    showError('📍', 'Geolocation Not Supported', 'Your browser does not support geolocation.');
    return;
  }

  showLoading();
  hideError();
  hideDashboard();
  $emptyState.style.display = 'none';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      getWeatherByCoords(latitude, longitude);
    },
    (geoError) => {
      hideLoading();
      if (geoError.code === geoError.PERMISSION_DENIED) {
        showError('🚫', 'Location Access Denied', 'Please allow location access in your browser settings and try again.');
      } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
        showError('📡', 'Location Unavailable', 'Unable to determine your location. Please try a manual search.');
      } else {
        showError('⏳', 'Location Timeout', 'Location request timed out. Please try again or search manually.');
      }
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
}

/* ============================================================
   WEATHER REPORT ACTIONS
   ============================================================ */

/**
 * buildReportText — Generates a plain-text weather report
 * @returns {string}
 */
function buildReportText() {
  const data = state.lastWeatherData;
  if (!data) return '';

  const { name, sys, weather, main, wind, visibility, timezone } = data;
  const condition = weather[0];
  const tzOffset  = timezone;
  const now       = new Date().toLocaleString('en-US');
  const flag      = getFlag(sys.country);

  return [
    `🌤️ WeatherPulse Report`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📍 Location: ${name}, ${flag} ${sys.country}`,
    `🕐 Time: ${now}`,
    ``,
    `☁️ Condition: ${condition.description}`,
    `🌡️ Temperature: ${Math.round(main.temp)}°C`,
    `🤔 Feels Like: ${Math.round(main.feels_like)}°C`,
    `↑ Max: ${Math.round(main.temp_max)}°C  ↓ Min: ${Math.round(main.temp_min)}°C`,
    ``,
    `💧 Humidity: ${main.humidity}%`,
    `🌡️ Pressure: ${main.pressure} hPa`,
    `💨 Wind: ${(wind.speed * 3.6).toFixed(1)} km/h (${getWindDirection(wind.deg)})`,
    `👁️ Visibility: ${visibility ? (visibility / 1000).toFixed(1) + ' km' : '—'}`,
    ``,
    `🌅 Sunrise: ${formatUnixTime(sys.sunrise, tzOffset)}`,
    `🌇 Sunset: ${formatUnixTime(sys.sunset, tzOffset)}`,
    ``,
    `Generated by WeatherPulse — https://openweathermap.org`,
  ].join('\n');
}

/**
 * copyWeatherReport — Copies the report text to clipboard
 */
async function copyWeatherReport() {
  const text = buildReportText();
  if (!text) { showToast('⚠️ No weather data to copy', 'error'); return; }

  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Weather report copied to clipboard!', 'success');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Copied to clipboard!', 'success');
  }
}

/**
 * shareWeatherReport — Uses Web Share API or falls back to copy
 */
async function shareWeatherReport() {
  const data = state.lastWeatherData;
  if (!data) { showToast('⚠️ No weather data to share', 'error'); return; }

  const text = buildReportText();
  const title = `Weather in ${data.name}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      showToast('✅ Report shared!', 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyWeatherReport();
      }
    }
  } else {
    copyWeatherReport();
  }
}

/**
 * downloadPDF — Opens print dialog (browser PDF save)
 */
function downloadPDF() {
  if (!state.lastWeatherData) {
    showToast('⚠️ No weather data to download', 'error');
    return;
  }
  showToast('🖨️ Opening print dialog for PDF...', 'info', 2500);
  setTimeout(() => window.print(), 600);
}

/* ============================================================
   REFRESH
   ============================================================ */

/**
 * refreshWeather — Re-fetches weather for the last searched location
 */
async function refreshWeather() {
  const iconEl = $refreshBtn.querySelector('.btn-icon');
  if (iconEl) {
    iconEl.style.animation = 'none';
    void iconEl.offsetWidth;
    iconEl.style.animation = 'spinOnce 0.6s ease';
  }

  if (state.lastLat && state.lastLon) {
    await getWeatherByCoords(state.lastLat, state.lastLon);
  } else if (state.lastQuery) {
    await getWeather(state.lastQuery);
  } else {
    showToast('💡 Search for a city first!', 'info', 2500);
  }
}

/* ============================================================
   EVENT LISTENERS & INITIALIZATION
   ============================================================ */

/**
 * init — Bootstrap function: sets up all event listeners and initial state
 */
function init() {
  // Restore theme
  loadTheme();

  // Load search history
  loadHistory();

  // Start live clock
  updateClock();
  state.clockInterval = setInterval(updateClock, 1000);

  // Show empty state initially
  $emptyState.style.display = 'block';

  /* ---- Search Events ---- */
  $searchBtn.addEventListener('click', () => {
    getWeather($city.value.trim());
  });

  $city.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      getWeather($city.value.trim());
    }
  });

  // Show/hide clear button
  $city.addEventListener('input', () => {
    $clearInput.style.display = $city.value ? 'flex' : 'none';
  });

  $clearInput.addEventListener('click', () => {
    $city.value = '';
    $city.focus();
    $clearInput.style.display = 'none';
  });

  /* ---- Location Button ---- */
  $locationBtn.addEventListener('click', searchByLocation);

  /* ---- Refresh Button ---- */
  $refreshBtn.addEventListener('click', refreshWeather);

  /* ---- Theme Toggle ---- */
  $themeBtn.addEventListener('click', toggleDarkMode);

  /* ---- History Clear ---- */
  $clearHistBtn.addEventListener('click', clearHistory);

  /* ---- Retry Button ---- */
  $retryBtn.addEventListener('click', () => {
    hideError();
    if (state.lastLat && state.lastLon) {
      getWeatherByCoords(state.lastLat, state.lastLon);
    } else if (state.lastQuery) {
      getWeather(state.lastQuery);
    } else {
      $emptyState.style.display = 'block';
    }
  });

  /* ---- Weather Report Actions ---- */
  $copyBtn.addEventListener('click',     copyWeatherReport);
  $shareBtn.addEventListener('click',    shareWeatherReport);
  $downloadBtn.addEventListener('click', downloadPDF);

  /* ---- Online/Offline detection ---- */
  window.addEventListener('online',  () => showToast('✅ Back online!', 'success', 2500));
  window.addEventListener('offline', () => showToast('🔴 You are offline', 'error', 5000));

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener('keydown', (e) => {
    // Ctrl + K or / → focus search
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
      e.preventDefault();
      $city.focus();
      $city.select();
    }

    // Escape → blur search input or close error
    if (e.key === 'Escape') {
      $city.blur();
      if ($errSec.style.display !== 'none') hideError();
    }
  });

  /* ---- Auto-detect location on first load (optional) ---- */
  // Uncomment the line below to auto-detect location on page load:
  // searchByLocation();
}

// ── Start the app ──
document.addEventListener('DOMContentLoaded', init);
