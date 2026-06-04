# Helios

Solar energy production simulator with real-time 3D visualization.

**[Live Demo](https://megatron54.github.io/Helios/)**

## What it does

Helios estimates annual energy production for a photovoltaic system based on location, panel orientation, and real climate data. It runs entirely in the browser with no backend.

- Select any location and fetch real TMY (Typical Meteorological Year) data from PVGIS
- Configure panel tilt, azimuth, quantity, and specifications
- See the sun path and shadow projection in an interactive 3D scene
- View monthly production breakdown and key performance metrics

## Architecture

```
┌────────────────────────────────────────────┐
│               Browser                       │
│                                            │
│  React + Three.js          C++ (WASM)      │
│  ┌──────────────┐    ┌──────────────────┐  │
│  │ 3D Scene     │    │ Solar Position   │  │
│  │ Charts       │◄───│ Irradiance Model │  │
│  │ Controls     │    │ Panel Physics    │  │
│  │              │    │ Shadow Tracing   │  │
│  └──────────────┘    └──────────────────┘  │
│         │                                  │
│         ▼                                  │
│  PVGIS API (EC) ─── TMY hourly data       │
└────────────────────────────────────────────┘
```

The simulation engine is written in C++ and compiled to WebAssembly via Emscripten. It runs 8760 hourly calculations (one full year) in under a second on modern hardware.

## Simulation engine

| Module | Description |
|--------|-------------|
| `solar_position` | Sun position algorithm based on Meeus/NREL SPA |
| `irradiance` | HDKR transposition model (horizontal to tilted plane) |
| `panel` | Thermal model (NOCT), IAM, DC/AC losses |
| `shadow` | Ray-box intersection for obstacle shading |
| `simulation` | Full-year orchestrator with optimizer |

## Tech stack

- **Engine**: C++17, compiled to WASM with Emscripten
- **Frontend**: React, TypeScript, Tailwind CSS
- **3D**: Three.js via React Three Fiber
- **Charts**: Recharts
- **Data**: PVGIS API (European Commission, no API key required)
- **Deploy**: GitHub Pages via GitHub Actions

## Building from source

### Engine (native, for testing)

```bash
cd engine
mkdir build && cd build
cmake ..
cmake --build .
ctest --output-on-failure
```

### Engine (WASM)

```bash
cd engine/wasm
mkdir build && cd build
emcmake cmake ..
cmake --build .
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Data sources

- **PVGIS v5.3** (re.jrc.ec.europa.eu) for hourly GHI, DNI, DHI, and temperature
- **NREL SPA** algorithm for solar position calculations

## License

MIT
