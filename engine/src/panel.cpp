#include "panel.h"
#include <cmath>
#include <algorithm>

namespace helios {

static constexpr double STC_IRRADIANCE = 1000.0;  // W/m2
static constexpr double STC_TEMP = 25.0;           // °C

double cell_temperature(double ambient_temp, double irradiance, double noct) {
    // Simplified thermal model based on NOCT definition
    // NOCT is measured at: 800 W/m2, 20°C ambient, 1 m/s wind
    return ambient_temp + (noct - 20.0) * (irradiance / 800.0);
}

double iam_ashrae(double aoi, double b0) {
    if (aoi >= 90.0) return 0.0;
    if (aoi <= 0.0) return 1.0;

    double cos_aoi = cos(aoi * 3.14159265358979 / 180.0);
    double iam = 1.0 - b0 * (1.0 / cos_aoi - 1.0);
    return std::max(0.0, iam);
}

PanelOutput compute_panel_output(
    double poa_irradiance,
    double ambient_temp,
    double aoi,
    const PanelSpec& panel,
    const SystemLosses& losses) {

    PanelOutput output = {0.0, 0.0, 0.0};

    if (poa_irradiance <= 0.0) return output;

    // Cell temperature
    output.cell_temp = cell_temperature(ambient_temp, poa_irradiance, panel.noct);

    // Temperature derating factor
    double temp_factor = 1.0 + (panel.temp_coeff / 100.0) * (output.cell_temp - STC_TEMP);
    if (temp_factor < 0.0) temp_factor = 0.0;

    // IAM correction
    double iam = iam_ashrae(aoi);

    // DC power output (per panel)
    double effective_irradiance = poa_irradiance * iam;
    double dc_per_panel = panel.rated_power * (effective_irradiance / STC_IRRADIANCE) * temp_factor;

    // Total DC power for the array
    output.dc_power = dc_per_panel * panel.quantity;

    // Apply DC losses
    double dc_loss_factor = (1.0 - losses.soiling) *
                            (1.0 - losses.mismatch) *
                            (1.0 - losses.wiring_dc);

    // Degradation over system age
    double degradation_factor = pow(1.0 - losses.degradation, losses.system_age);

    // AC output after inverter and AC wiring
    output.ac_power = output.dc_power * dc_loss_factor * degradation_factor *
                      losses.inverter_eff * (1.0 - losses.wiring_ac);

    if (output.ac_power < 0.0) output.ac_power = 0.0;

    return output;
}

}  // namespace helios
