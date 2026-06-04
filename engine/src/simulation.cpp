#include "simulation.h"
#include <cmath>
#include <algorithm>

namespace helios {

SimulationResult run_simulation(
    const SimulationConfig& config,
    const std::vector<TMYRecord>& tmy) {

    SimulationResult result;
    result.hourly.resize(8760);
    result.annual_energy_kwh = 0.0;
    result.peak_power_kw = config.panel.rated_power * config.panel.quantity / 1000.0;

    for (int i = 0; i < 12; ++i) {
        result.monthly[i] = {0.0, 0.0, 0.0, 0};
    }

    // Build panel grid for shadow calculation
    PanelGrid grid;
    grid.origin = {0.0, 0.0, 2.5};  // panels at roof height
    grid.tilt = config.surface.tilt;
    grid.azimuth = config.surface.azimuth;
    grid.rows = 4;
    grid.cols = 4;
    // Estimate total array dimensions
    int panels_per_row = static_cast<int>(ceil(sqrt(config.panel.quantity)));
    grid.total_width = panels_per_row * 1.0;   // ~1m wide per panel
    grid.total_height = (config.panel.quantity / panels_per_row) * 1.9;

    // Map hour index to month
    static const int days_in_month[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int hour_to_month[8760];
    int idx = 0;
    for (int m = 0; m < 12; ++m) {
        for (int d = 0; d < days_in_month[m]; ++d) {
            for (int h = 0; h < 24; ++h) {
                if (idx < 8760) hour_to_month[idx] = m;
                idx++;
            }
        }
    }

    double total_poa = 0.0;
    int month_hours_count[12] = {};

    for (int i = 0; i < 8760 && i < static_cast<int>(tmy.size()); ++i) {
        const TMYRecord& rec = tmy[i];

        // Determine date/time from hour index
        int hour_in_year = i;
        int doy = hour_in_year / 24 + 1;
        int hour_of_day = hour_in_year % 24;

        // Convert day of year to month/day
        int month = 0, day = 1;
        int accumulated = 0;
        for (int m = 0; m < 12; ++m) {
            if (accumulated + days_in_month[m] > (doy - 1)) {
                month = m;
                day = doy - accumulated;
                break;
            }
            accumulated += days_in_month[m];
        }

        DateTime dt;
        dt.year = 2023;  // TMY representative year
        dt.month = month + 1;
        dt.day = day;
        dt.hour = hour_of_day;
        dt.minute = 30;  // mid-hour
        dt.second = 0;
        dt.timezone = 0.0;  // TMY data is typically in UTC or solar time

        // Sun position
        SunPosition sun = compute_sun_position(config.location, dt);

        HourlyResult& hr = result.hourly[i];
        hr.ac_power = 0.0;
        hr.poa_irradiance = 0.0;
        hr.cell_temp = rec.temperature;
        hr.shading = 0.0;

        if (sun.elevation <= 0.0) continue;

        // Irradiance on tilted plane
        HourlyIrradiance horiz = {rec.ghi, rec.dni, rec.dhi};
        IrradianceComponents poa = transpose_irradiance(horiz, sun, config.surface, config.ground_albedo);
        hr.poa_irradiance = poa.global;

        if (poa.global <= 0.0) continue;

        // Shading
        double shading = compute_shading_fraction(grid, config.obstacles, sun);
        hr.shading = shading;
        double effective_poa = poa.global * (1.0 - shading);

        // Panel output
        double aoi = angle_of_incidence(sun, config.surface);
        PanelOutput panel_out = compute_panel_output(
            effective_poa, rec.temperature, aoi, config.panel, config.losses);

        hr.ac_power = panel_out.ac_power;
        hr.cell_temp = panel_out.cell_temp;

        // Accumulate
        double energy_wh = hr.ac_power;  // 1 hour interval, so W = Wh
        result.annual_energy_kwh += energy_wh / 1000.0;

        int m = hour_to_month[i];
        result.monthly[m].energy_kwh += energy_wh / 1000.0;
        result.monthly[m].irradiation += hr.poa_irradiance / 1000.0;  // Wh/m2 -> kWh/m2
        result.monthly[m].avg_temp += hr.cell_temp;
        month_hours_count[m]++;
        if (hr.ac_power > 0.0) result.monthly[m].hours_sun++;

        total_poa += hr.poa_irradiance / 1000.0;
    }

    // Finalize monthly averages
    for (int m = 0; m < 12; ++m) {
        if (month_hours_count[m] > 0) {
            result.monthly[m].avg_temp /= month_hours_count[m];
        }
    }

    // Performance metrics
    if (result.peak_power_kw > 0.0) {
        result.specific_yield = result.annual_energy_kwh / result.peak_power_kw;
    }
    if (total_poa > 0.0 && result.peak_power_kw > 0.0) {
        double reference_yield = total_poa;  // kWh/m2 on POA
        double final_yield = result.specific_yield;
        result.performance_ratio = final_yield / reference_yield;
    }
    result.capacity_factor = result.annual_energy_kwh / (result.peak_power_kw * 8760.0);

    return result;
}

OptimalOrientation optimize_orientation(
    const Location& location,
    const PanelSpec& panel,
    const SystemLosses& losses,
    const std::vector<TMYRecord>& tmy,
    double tilt_step,
    double azimuth_step) {

    OptimalOrientation best = {0.0, 180.0, 0.0};

    SimulationConfig config;
    config.location = location;
    config.panel = panel;
    config.losses = losses;
    config.ground_albedo = 0.2;

    for (double tilt = 0.0; tilt <= 90.0; tilt += tilt_step) {
        for (double azimuth = 0.0; azimuth < 360.0; azimuth += azimuth_step) {
            config.surface = {tilt, azimuth};
            SimulationResult res = run_simulation(config, tmy);

            if (res.annual_energy_kwh > best.annual_kwh) {
                best.tilt = tilt;
                best.azimuth = azimuth;
                best.annual_kwh = res.annual_energy_kwh;
            }
        }
    }

    return best;
}

}  // namespace helios
