# AKTIN Broker API Key Manager

Cross-platform desktop app for managing API keys of the AKTIN Emergency Department Data Registry Broker.

Built with **Vue 3**, **PrimeVue** and **Electron Forge**.

---

## Features

- Add, activate, and deactivate AKTIN Broker API keys
- Save and switch between credential profiles
- Encrypt credentials using AES-GCM with system keychain

---

## Development

1. Clone the repository:

```bash
git clone https://github.com/your-org/apikey-manager-gui.git
cd apikey-manager-gui
```

2. Install dependencies:

```bash
npm install
```

3. Start the app in development mode:

```bash
npm run start
```

This launches Electron with hot-reloading via Vite. Changes to Vue components are reflected instantly.

---

## Build for Production

1. Bundle and package the app:

```bash
npm run make
```

2. Output files will be in the `out/` directory. Currently, only a `.deb` package is generated for Debian-based Linux systems.