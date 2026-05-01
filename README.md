# Notes Vector Search (Tauri)

Desktop notes app migrated from Electron to Tauri v2.

## Stack
- Tauri v2
- React + Vite + TypeScript
- TailwindCSS + Zustand

## Development
```bash
npm install
npm run tauri:dev
```

### Linux Wayland/X11 launch variants
```bash
# Force X11 (recommended workaround for some Wayland protocol issues)
npm run tauri:dev:x11

# Force native Wayland
npm run tauri:dev:wayland

# Wayland with safer WebKit mode
npm run tauri:dev:wayland-safe
```

## Build
```bash
npm run tauri:build
```

### Run built binary with backend selection
```bash
npm run tauri:run:x11
npm run tauri:run:wayland
```

## Web-only frontend (optional)
```bash
npm run web:dev
npm run web:build
```

## Linux runtime packages (Debian/Ubuntu)
```bash
sudo apt install -y \
  libwebkit2gtk-4.1-0 \
  libgtk-3-0 \
  libayatana-appindicator3-1 \
  librsvg2-common
```

## Migration Notes
- Electron runtime/tooling removed.
- Tauri runtime scaffold added in `src-tauri/`.
- Frontend directory layout kept.
- Settings persistence currently stays on the React side (`localStorage`), with no Rust-side event/command implementation.
