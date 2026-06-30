# 🌤️ WeatherPulse — Premium Weather Dashboard

A **production-ready**, beautifully designed weather dashboard built with **pure HTML, CSS, and Vanilla JavaScript**. Featuring a premium glassmorphism UI, real-time weather data, animated visualizations, and a host of advanced features — all without any frameworks or dependencies.

---

## 🖼️ Preview

> Open `index.html` in your browser after adding your API key to experience the full dashboard.

---

## ✨ Features

### 🌍 Core Weather Data
- 🌡️ **Temperature** with color-coded display (Red/Orange/Green/Blue)
- 🤔 **Feels Like**, Min/Max temperature
- 💧 **Humidity** with animated progress bar
- 🌡️ **Atmospheric Pressure**
- 💨 **Wind Speed, Direction & Gust** with animated compass
- 👁️ **Visibility**
- 🌅 **Sunrise & Sunset** with animated sun arc
- 🌿 **Air Quality Index (AQI)**
- ☀️ **UV Index**

### 🔍 Search
- Search by **city name** (button click or Enter key)
- **"Use My Location"** button via Geolocation API
- Empty search prevention
- **Live clock & date** in navbar

### 🕐 Search History
- **localStorage** persistence (last 8 searches)
- **Clickable chips** for one-click re-search
- **Clear All** button

### 🎨 Dynamic UI
- **Weather-based gradient backgrounds** (Sunny / Cloudy / Rain / Thunder / Snow / Mist / Night)
- **Dark / Light mode** toggle with localStorage persistence
- **Animated particles** in background
- **Floating weather icon** animation
- **Sun arc visualization** showing current sun position
- **Wind compass** with needle rotation

### 📋 Report Actions
- **📋 Copy Report** — Copies full weather report to clipboard
- **🔗 Share** — Web Share API (falls back to copy)
- **📥 Download PDF** — Browser print-to-PDF

### ⚠️ Error Handling
- Beautiful animated **error cards** (City Not Found / No Internet / API Error / Rate Limit / Invalid Key)
- **Retry button** on all errors
- Online/Offline detection toasts

### 🔔 Toast Notifications
- Non-intrusive **toast system** for all feedback
- Smooth slide-in/out animations

### ♿ Accessibility
- Semantic HTML5
- ARIA labels and roles
- Keyboard navigation (`Ctrl+K` / `/` to focus search)
- Visible focus states

### 📱 Responsive Design
- Mobile-first layout
- CSS Grid + Flexbox
- Adapts to Desktop, Tablet, Mobile
- Print-optimized for PDF export

---

## 🛠️ Technologies

| Technology | Usage |
|---|---|
| **HTML5** | Semantic structure, ARIA, SEO meta tags |
| **CSS3** | Glassmorphism, animations, CSS Grid, Flexbox, custom properties |
| **Vanilla JavaScript (ES2020+)** | Fetch API, async/await, Promises, DOM manipulation, localStorage |
| **OpenWeatherMap API** | Current weather, AQI, UV Index |
| **Geolocation API** | Auto-detect user location |
| **Web Share API** | Native share on mobile |
| **localStorage** | Theme and search history persistence |
| **Google Fonts** | Outfit + Inter typography |

---

## 🌐 API Used

**OpenWeatherMap** — [https://openweathermap.org](https://openweathermap.org)

| Endpoint | Purpose |
|---|---|
| `/data/2.5/weather?q={city}` | Search by city name |
| `/data/2.5/weather?lat={lat}&lon={lon}` | Search by coordinates |
| `/data/2.5/air_pollution` | Air Quality Index (AQI) |
| `/data/2.5/uvi` | UV Index |

---

## 📁 Folder Structure

```
weather api/
├── index.html     # Main HTML — semantic structure, ARIA labels
├── style.css      # Complete styles — glassmorphism, animations, themes
├── script.js      # All JavaScript logic, API calls, event handlers
└── README.md      # This file
```

---

## 🚀 Installation & Setup

### Step 1: Get a Free API Key

1. Visit [https://openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for a **free account**
3. Go to **API Keys** in your dashboard
4. Copy your key (it activates within 15–30 minutes)

### Step 2: Add Your API Key

Open `script.js` and replace `YOUR_API_KEY_HERE` on **line 17**:

```javascript
const API_KEY = 'your_actual_api_key_here';
```

### Step 3: Open the App

Simply open `index.html` in any modern browser:
- Double-click `index.html`, or
- Use VS Code **Live Server** extension for hot reload, or
- Use `npx serve .` in the terminal

> ⚠️ The Geolocation API requires **HTTPS** in production (works on localhost).

---

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Search weather |
| `Ctrl + K` | Focus search input |
| `/` | Focus search input |
| `Escape` | Blur input / close error |

---

## 🌈 Weather Backgrounds

| Condition | Gradient |
|---|---|
| ☀️ Clear (Day) | Orange → Red → Pink |
| ☁️ Cloudy | Slate grey tones |
| 🌧️ Rain | Navy → Blue → Cyan |
| ⛈️ Thunderstorm | Dark Purple |
| ❄️ Snow | Ice Blue → Sky Blue |
| 🌫️ Mist / Fog | Soft Grey |
| 🌙 Clear (Night) | Dark Navy → Indigo |

---

## 🌡️ Temperature Colors

| Range | Color |
|---|---|
| Above 35°C | 🔴 Red |
| 20–35°C | 🟠 Orange |
| 10–20°C | 🟢 Green |
| Below 10°C | 🔵 Blue |

---

## 🔮 Future Improvements

- [ ] **7-Day Forecast** using `/data/2.5/forecast`
- [ ] **Hourly Forecast** chart using Canvas/SVG
- [ ] **Multiple Cities** comparison panel
- [ ] **Weather Alerts** / severe weather warnings
- [ ] **Historical Data** charts
- [ ] **PWA** (Progressive Web App) with offline support
- [ ] **Unit toggle** (°C / °F)
- [ ] **Weather Maps** (precipitation, wind, temp overlays)
- [ ] **Moon phase** data
- [ ] **Pollen count** integration

---

## 📄 License

MIT License — Free to use and modify.

---

## 👨‍💻 Credits

Built with ❤️ using pure HTML, CSS & Vanilla JavaScript.  
Weather data powered by [OpenWeatherMap](https://openweathermap.org).  
Typography by [Google Fonts](https://fonts.google.com).
