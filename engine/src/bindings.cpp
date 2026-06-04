#include <emscripten/bind.h>
#include "solar_position.h"
#include "irradiance.h"
#include "panel.h"
#include "shadow.h"
#include "simulation.h"

using namespace emscripten;
using namespace helios;

// Wrapper to accept TMY data as flat arrays from JavaScript
SimulationResult run_simulation_js(
    double lat, double lon, double elevation,
    double tilt, double azimuth,
    double rated_power, double efficiency, double area,
    double temp_coeff, double noct, int quantity,
    double ground_albedo,
    val ghi_arr, val dni_arr, val dhi_arr, val temp_arr) {

    SimulationConfig config;
    config.location = {lat, lon, elevation};
    config.surface = {tilt, azimuth};
    config.panel = {rated_power, efficiency, area, temp_coeff, noct, quantity};
    config.losses = SystemLosses::default_losses();
    config.ground_albedo = ground_albedo;

    int length = ghi_arr["length"].as<int>();
    std::vector<TMYRecord> tmy(length);
    for (int i = 0; i < length; ++i) {
        tmy[i].ghi = ghi_arr[i].as<double>();
        tmy[i].dni = dni_arr[i].as<double>();
        tmy[i].dhi = dhi_arr[i].as<double>();
        tmy[i].temperature = temp_arr[i].as<double>();
        tmy[i].wind_speed = 2.0;
    }

    return run_simulation(config, tmy);
}

OptimalOrientation optimize_orientation_js(
    double lat, double lon, double elevation,
    double rated_power, double efficiency, double area,
    double temp_coeff, double noct, int quantity,
    val ghi_arr, val dni_arr, val dhi_arr, val temp_arr) {

    Location location = {lat, lon, elevation};
    PanelSpec panel = {rated_power, efficiency, area, temp_coeff, noct, quantity};
    SystemLosses losses = SystemLosses::default_losses();

    int length = ghi_arr["length"].as<int>();
    std::vector<TMYRecord> tmy(length);
    for (int i = 0; i < length; ++i) {
        tmy[i].ghi = ghi_arr[i].as<double>();
        tmy[i].dni = dni_arr[i].as<double>();
        tmy[i].dhi = dhi_arr[i].as<double>();
        tmy[i].temperature = temp_arr[i].as<double>();
        tmy[i].wind_speed = 2.0;
    }

    return optimize_orientation(location, panel, losses, tmy, 5.0, 10.0);
}

SunPosition get_sun_position_js(double lat, double lon, double elev,
                                 int year, int month, int day,
                                 int hour, int minute, double timezone) {
    Location loc = {lat, lon, elev};
    DateTime dt = {year, month, day, hour, minute, 0, timezone};
    return compute_sun_position(loc, dt);
}

EMSCRIPTEN_BINDINGS(helios) {
    value_object<SunPosition>("SunPosition")
        .field("elevation", &SunPosition::elevation)
        .field("azimuth", &SunPosition::azimuth)
        .field("zenith", &SunPosition::zenith)
        .field("declination", &SunPosition::declination)
        .field("hourAngle", &SunPosition::hour_angle)
        .field("equationOfTime", &SunPosition::equation_of_time);

    value_object<HourlyResult>("HourlyResult")
        .field("acPower", &HourlyResult::ac_power)
        .field("poaIrradiance", &HourlyResult::poa_irradiance)
        .field("cellTemp", &HourlyResult::cell_temp)
        .field("shading", &HourlyResult::shading);

    value_object<MonthlyResult>("MonthlyResult")
        .field("energyKwh", &MonthlyResult::energy_kwh)
        .field("irradiation", &MonthlyResult::irradiation)
        .field("avgTemp", &MonthlyResult::avg_temp)
        .field("hoursSun", &MonthlyResult::hours_sun);

    value_object<OptimalOrientation>("OptimalOrientation")
        .field("tilt", &OptimalOrientation::tilt)
        .field("azimuth", &OptimalOrientation::azimuth)
        .field("annualKwh", &OptimalOrientation::annual_kwh);

    register_vector<HourlyResult>("VectorHourlyResult");

    class_<SimulationResult>("SimulationResult")
        .property("annualEnergyKwh", &SimulationResult::annual_energy_kwh)
        .property("specificYield", &SimulationResult::specific_yield)
        .property("performanceRatio", &SimulationResult::performance_ratio)
        .property("capacityFactor", &SimulationResult::capacity_factor)
        .property("peakPowerKw", &SimulationResult::peak_power_kw)
        .function("getHourly", +[](const SimulationResult& r) { return r.hourly; })
        .function("getMonthly", +[](const SimulationResult& r, int month) {
            if (month < 0 || month > 11) return MonthlyResult{0, 0, 0, 0};
            return r.monthly[month];
        });

    function("runSimulation", &run_simulation_js);
    function("optimizeOrientation", &optimize_orientation_js);
    function("getSunPosition", &get_sun_position_js);
}
