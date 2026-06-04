#pragma once

#include "solar_position.h"
#include "irradiance.h"
#include "panel.h"
#include "shadow.h"
#include <vector>

namespace helios {

struct TMYRecord {
    double ghi;             // W/m2
    double dni;             // W/m2
    double dhi;             // W/m2
    double temperature;     // °C
    double wind_speed;      // m/s (optional, not used currently)
};

struct SimulationConfig {
    Location location;
    TiltedSurface surface;
    PanelSpec panel;
    SystemLosses losses;
    std::vector<Obstacle> obstacles;
    double ground_albedo;

    static SimulationConfig default_config() {
        SimulationConfig cfg;
        cfg.location = {40.4168, -3.7038, 650.0};  // Madrid
        cfg.surface = {35.0, 180.0};                 // 35° tilt, south-facing
        cfg.panel = PanelSpec::default_panel();
        cfg.losses = SystemLosses::default_losses();
        cfg.ground_albedo = 0.2;
        return cfg;
    }
};

struct HourlyResult {
    double ac_power;         // W
    double poa_irradiance;   // W/m2
    double cell_temp;        // °C
    double shading;          // fraction [0,1]
};

struct MonthlyResult {
    double energy_kwh;       // kWh produced
    double irradiation;      // kWh/m2 on plane of array
    double avg_temp;         // °C average cell temperature
    int hours_sun;           // hours with production > 0
};

struct SimulationResult {
    std::vector<HourlyResult> hourly;   // 8760 entries
    MonthlyResult monthly[12];
    double annual_energy_kwh;
    double specific_yield;       // kWh/kWp
    double performance_ratio;
    double capacity_factor;
    double peak_power_kw;        // installed capacity
};

// Run full-year simulation with 8760 hourly TMY records.
SimulationResult run_simulation(
    const SimulationConfig& config,
    const std::vector<TMYRecord>& tmy);

// Find optimal tilt and azimuth for maximum annual yield.
struct OptimalOrientation {
    double tilt;
    double azimuth;
    double annual_kwh;
};

OptimalOrientation optimize_orientation(
    const Location& location,
    const PanelSpec& panel,
    const SystemLosses& losses,
    const std::vector<TMYRecord>& tmy,
    double tilt_step = 5.0,
    double azimuth_step = 10.0);

}  // namespace helios
