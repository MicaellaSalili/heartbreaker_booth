# Heartbreaker Booth — How Fast Is Your BPM?

[![Status: archived](https://img.shields.io/badge/status-archived-lightgrey)](https://github.com/your-org/heartbreaker-booth)
[![Hosted: none](https://img.shields.io/badge/hosted-none-red)](https://github.com/your-org/heartbreaker-booth)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

This is an interactive web experience that measures a player's heart rate from a connected sensor and turns the result into a short game where winners receive a photobooth-style photo. The sensor firmware (Arduino) computes and prints BPM over serial, which the browser consumes via the Web Serial API; optional browser-side DSP for raw-signal processing can be added if you prefer doing peak detection client-side. This project was developed as a school Digital Signal Processing project and used as an event booth experience.

## Project Definition

- **Goal:** Read live heartbeat data from a sensor (Arduino/ESP), obtain BPM (computed by firmware or optionally by browser-side DSP), and present a game/photobooth flow that rewards players with photos and optional leaderboard placement.
- **Primary users:** Event attendees, demo participants, classmates and instructors.
- **Key outcomes:** Reliable BPM detection, engaging UI, photobooth capture, and persistent leaderboard storage.

## Features

- Live serial connection to heartbeat sensor (Web Serial).
- Real-time DSP: basic DSP/peak-detection is implemented in the sensor firmware (PulseSensor library). The browser currently parses BPM values printed by the firmware; browser-side raw-signal DSP can be added for alternate algorithms.
- Play mode with scoring based on BPM or steadiness.
- Photobooth capture and optional overlays/branding.
- Leaderboard stored in Firebase Firestore.
- Simple admin controls for clearing sessions and moderating submissions.

## Tech Stack

- Frontend: HTML, CSS, JavaScript (ES6). See `index.html`, `battle.html`, `photo.html`.
- Sensor Firmware: C++ (Arduino/ESP32) — see `sensors.c++`.
- Realtime I/O: Web Serial API integration (`js/serial.js`, `real_serial.js`).
- Backend / Hosting: Firebase Hosting and Firestore (configuration in `js/firebase-config.js`, `firebase.json`).
- Optional: Chart.js for live visualization; Cloud Functions for advanced server-side processing.

## Status

- Development: Prototype complete; sensor integration and photobooth flow implemented.
- Testing: Recommended calibration and playtesting at events.
- Deployment: Firebase-ready (see `firebase.json`).

Note: This project was presented as a live booth at a fair. The live site has been undeployed and is no longer hosted, but the source code and documentation remain available in this repository for reference and reuse.



## Quick Start

1. Clone the repository and open it in a Chromium-based browser with Web Serial support.

```bash
git clone <your-repo-url>
cd heartbreaker_booth
```

2. Install the Firebase CLI (optional, for hosting):

```bash
npm install -g firebase-tools
```

3. Add your Firebase configuration: replace the contents of `js/firebase-config.js` with your project's config from the Firebase Console.

4. Serve locally (or deploy to Firebase Hosting):

```bash
firebase serve
# or
firebase deploy --only hosting
```

The site will be available at `http://localhost:5000` when served locally.

## Troubleshooting

- Ensure your browser allows camera and serial access (Chromium-based browsers recommended for Web Serial).
- Verify `js/firebase-config.js` contains the correct Firebase config. The repo includes a sample config; replace it with your project credentials before deploying.
- Serial tips: the firmware prints BPM lines like `BPM: 72` and raw signal lines like `Signal: 512` at `9600` baud by default (see `sensors.c++`). Make sure your device is set to `9600` and that no other program has the serial port open.

Architecture (simple):

sensor (Arduino/ESP) -> serial (USB) -> browser (Web Serial API) -> UI / Firestore

## Project Structure

- `index.html`, `battle.html`, `photo.html` — Main pages
- `js/` — JavaScript files (game logic, serial integration, Firebase integration)
- `css/` — Styles
- `assets/` — Images and other assets

## License

MIT
