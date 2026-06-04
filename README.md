# Helios

Solar energy system planner with real-time 3D visualization, hourly energy dispatch simulation, and full component sizing (panels, battery, inverter, diesel generator).

**[Live Demo](https://megatron54.github.io/Helios/)**

## What it does

Helios designs and simulates a complete photovoltaic system tailored to your location, consumption, and preferences. It runs entirely in the browser with no backend or API dependencies.

- Enter coordinates and roof dimensions
- Estimate consumption from 30+ appliance templates or manual kWh input
- Choose system mode: on-grid, off-grid, or hybrid
- Configure battery storage, autonomy days, and optimization priority
- Auto-size panels, inverter, battery, and diesel generator within budget
- Run 8,760-hour simulation with energy dispatch (PV → Load → Battery → Grid/Generator)
- View results: self-sufficiency, payback, LCOE, 25-year NPV, battery lifetime
- Export a professional 2-page PDF report
- Interact with the 3D scene: adjust time/date, see equipment and sun path

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                            │
│                                                          │
│  React + Three.js                 C++ (WASM)             │
│  ┌──────────────────────┐    ┌────────────────────────┐  │
│  │ Wizard UI            │    │ Solar Position (SPA)   │  │
│  │ 3D Scene + Equipment │◄───│ Irradiance Model       │  │
│  │ Charts               │    │ Panel Physics          │  │
│  │ PDF Export           │    │ Shadow Tracing         │  │
│  └──────────────────────┘    └────────────────────────┘  │
│         │                                                │
│         ▼                                                │
│  TypeScript Engine                                       │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Synthetic TMY Generator (clear-sky model)        │    │
│  │ Energy Dispatch (8760h battery/grid/gen flow)    │    │
│  │ Battery Degradation (cycle-based capacity fade)  │    │
│  │ Generator Model (partial-load fuel curves)       │    │
│  │ Optimizer (multi-component sizing + budget)      │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Simulation engine

### WASM (C++17 via Emscripten)

| Module | Description |
|--------|-------------|
| `solar_position` | Sun position algorithm based on Meeus/NREL SPA |
| `irradiance` | HDKR transposition model (horizontal to tilted plane) |
| `panel` | Thermal model (NOCT), IAM, DC/AC conversion losses |
| `shadow` | Ray-box intersection for obstacle shading |
| `simulation` | Full-year orchestrator, 8760 hourly steps |

### TypeScript

| Module | Description |
|--------|-------------|
| `synthetic-tmy` | Clear-sky irradiance model (Ineichen-Perez simplified) |
| `energy-dispatch` | Hourly PV→Load→Battery→Grid/Generator flow simulation |
| `battery-degradation` | Cycle-based capacity fade, replacement year projection |
| `generator` | Partial-load fuel consumption, maintenance cost model |
| `optimizer` | System sizing: panels, battery, inverter, generator |
| `recommendation` | Quick panel sizing from consumption/yield |
| `consumption` | Appliance-based annual kWh with seasonal distribution |
| `roof-layout` | Tilt-aware row spacing and max panel fitting |
| `report` | 2-page PDF generation via jsPDF |

## Features

- **Consumption estimator**: 30+ appliance library with seasonal monthly distribution
- **System preferences**: on-grid/off-grid/hybrid, battery toggle, autonomy days, budget cap, priority selection
- **Auto-sizing**: optimizer recommends panels, inverter, battery, and generator based on constraints
- **Energy dispatch**: hourly simulation with battery SOC tracking, generator auto-start/stop, self-sufficiency calculation
- **Battery model**: LFP/NMC degradation, cycle-based capacity fade, replacement year, 25-year cost
- **Generator model**: diesel with partial-load fuel penalty, maintenance scheduling, auto-sizing from peak deficit
- **Financial analysis**: payback, 25-year NPV (3% discount), LCOE, fuel/maintenance costs
- **3D visualization**: PBR panels on configurable roof, battery cabinet, inverter box, generator, sky/sun, time controls
- **PDF export**: professional 2-page report with all specs, monthly table, and financials

## Tech stack

- **Engine**: C++17 compiled to WASM (Emscripten 3.1.61), 69KB binary
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **3D**: Three.js via React Three Fiber, drei helpers, SMAA post-processing
- **Charts**: Recharts
- **PDF**: jsPDF
- **Data**: Synthetic clear-sky TMY model (no external API dependency)
- **Deploy**: GitHub Pages via GitHub Actions (builds WASM + frontend)

## Building from source

### Engine (native tests)

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

Production build:

```bash
npm run build
```

## Project structure

```
helios/
├── engine/              C++ simulation engine
│   ├── src/             Source files (solar_position, irradiance, panel, shadow)
│   ├── tests/           5 unit tests
│   └── wasm/            Emscripten bindings + CMakeLists
├── frontend/
│   ├── src/
│   │   ├── components/  React components (Scene3D, Controls, Charts, etc.)
│   │   ├── lib/         TypeScript engine modules
│   │   ├── hooks/       useHeliosEngine (WASM loader)
│   │   ├── data/        Appliance library
│   │   └── types/       TypeScript interfaces
│   └── public/          Static assets + WASM output (git-ignored, CI-built)
└── .github/workflows/   CI/CD pipeline
```

## License

MIT
