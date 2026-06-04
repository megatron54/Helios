#pragma once

namespace helios {

struct PanelSpec {
    double rated_power;       // Wp (peak watts at STC)
    double efficiency;        // fraction (e.g., 0.21 for 21%)
    double area;              // m2 per panel
    double temp_coeff;        // %/°C (negative value, e.g., -0.35)
    double noct;              // Nominal Operating Cell Temperature (°C), typically 45
    int quantity;             // number of panels

    // Default: typical 400Wp monocrystalline panel
    static PanelSpec default_panel() {
        return {400.0, 0.21, 1.9, -0.35, 45.0, 10};
    }
};

struct SystemLosses {
    double soiling;          // fraction (e.g., 0.02 = 2%)
    double mismatch;         // fraction
    double wiring_dc;        // fraction
    double wiring_ac;        // fraction
    double inverter_eff;     // fraction (e.g., 0.96)
    double degradation;      // fraction per year (e.g., 0.005 = 0.5%/year)
    int system_age;          // years since installation

    static SystemLosses default_losses() {
        return {0.02, 0.02, 0.02, 0.01, 0.96, 0.005, 0};
    }
};

struct PanelOutput {
    double dc_power;   // Watts DC before inverter
    double ac_power;   // Watts AC after all losses
    double cell_temp;  // Cell temperature (°C)
};

// Compute cell temperature from ambient temperature and irradiance.
double cell_temperature(double ambient_temp, double irradiance, double noct);

// Compute panel output for given irradiance and conditions.
PanelOutput compute_panel_output(
    double poa_irradiance,   // Plane-of-array irradiance (W/m2)
    double ambient_temp,     // Ambient temperature (°C)
    double aoi,              // Angle of incidence (degrees)
    const PanelSpec& panel,
    const SystemLosses& losses);

// Angle of incidence modifier (IAM) using ASHRAE model.
double iam_ashrae(double aoi, double b0 = 0.05);

}  // namespace helios
