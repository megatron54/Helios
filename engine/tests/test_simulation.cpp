#include "simulation.h"
#include <cstdio>
#include <cmath>
#include <vector>

using namespace helios;

static int tests_run = 0;
static int tests_passed = 0;

void assert_near(double actual, double expected, double tolerance, const char* msg) {
    tests_run++;
    if (std::abs(actual - expected) <= tolerance) {
        tests_passed++;
    } else {
        printf("FAIL: %s — expected %.4f, got %.4f (tol %.4f)\n", msg, expected, actual, tolerance);
    }
}

void assert_true(bool condition, const char* msg) {
    tests_run++;
    if (condition) tests_passed++;
    else printf("FAIL: %s\n", msg);
}

// Generate synthetic TMY data for testing.
// Simplified: clear-sky model based on solar position.
std::vector<TMYRecord> generate_synthetic_tmy(const Location& loc) {
    std::vector<TMYRecord> tmy(8760);

    static const int days_in_month[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    int idx = 0;

    for (int m = 0; m < 12; ++m) {
        for (int d = 0; d < days_in_month[m]; ++d) {
            for (int h = 0; h < 24; ++h) {
                DateTime dt = {2023, m + 1, d + 1, h, 30, 0, 0.0};
                SunPosition sun = compute_sun_position(loc, dt);

                TMYRecord& rec = tmy[idx];
                rec.wind_speed = 2.0;

                if (sun.elevation > 0.0) {
                    // Simplified clear-sky model
                    double am = 1.0 / sin(sun.elevation * 3.14159265 / 180.0);
                    if (am > 40.0) am = 40.0;
                    double dni = 1361.0 * 0.7 * pow(0.678, am);
                    double dhi = 100.0 * sin(sun.elevation * 3.14159265 / 180.0);
                    double ghi = dni * sin(sun.elevation * 3.14159265 / 180.0) + dhi;

                    rec.ghi = ghi;
                    rec.dni = dni;
                    rec.dhi = dhi;
                    // Temperature: diurnal variation
                    rec.temperature = 15.0 + 10.0 * sin((h - 6.0) * 3.14159265 / 12.0);
                } else {
                    rec.ghi = 0.0;
                    rec.dni = 0.0;
                    rec.dhi = 0.0;
                    rec.temperature = 8.0;
                }
                idx++;
            }
        }
    }

    return tmy;
}

void test_basic_simulation() {
    // Madrid, 35° tilt, south-facing, 10 panels * 400Wp = 4kWp
    SimulationConfig config = SimulationConfig::default_config();
    Location madrid = {40.4168, -3.7038, 650.0};
    config.location = madrid;

    std::vector<TMYRecord> tmy = generate_synthetic_tmy(madrid);
    SimulationResult result = run_simulation(config, tmy);

    // Madrid, 4kWp system, should produce roughly 5000-7000 kWh/year
    // With synthetic clear-sky data, likely higher
    printf("  Annual energy: %.1f kWh\n", result.annual_energy_kwh);
    printf("  Specific yield: %.1f kWh/kWp\n", result.specific_yield);
    printf("  Performance ratio: %.3f\n", result.performance_ratio);
    printf("  Capacity factor: %.3f\n", result.capacity_factor);

    assert_true(result.annual_energy_kwh > 3000.0, "Annual energy > 3000 kWh for 4kWp in Madrid");
    assert_true(result.annual_energy_kwh < 12000.0, "Annual energy < 12000 kWh (sanity check)");
    assert_true(result.specific_yield > 800.0, "Specific yield > 800 kWh/kWp");
    assert_true(result.performance_ratio > 0.5, "PR > 0.5");
    assert_true(result.performance_ratio < 1.0, "PR < 1.0");
}

void test_monthly_distribution() {
    SimulationConfig config = SimulationConfig::default_config();
    Location madrid = {40.4168, -3.7038, 650.0};
    config.location = madrid;

    std::vector<TMYRecord> tmy = generate_synthetic_tmy(madrid);
    SimulationResult result = run_simulation(config, tmy);

    // Summer months should produce more than winter months
    double june = result.monthly[5].energy_kwh;    // June
    double december = result.monthly[11].energy_kwh;  // December

    printf("  June: %.1f kWh, December: %.1f kWh\n", june, december);
    assert_true(june > december, "June production > December production");

    // All months should have some production
    for (int m = 0; m < 12; ++m) {
        assert_true(result.monthly[m].energy_kwh > 0.0, "Each month has production > 0");
    }
}

void test_tilt_effect() {
    Location madrid = {40.4168, -3.7038, 650.0};
    std::vector<TMYRecord> tmy = generate_synthetic_tmy(madrid);

    SimulationConfig flat_config = SimulationConfig::default_config();
    flat_config.location = madrid;
    flat_config.surface = {0.0, 180.0};  // flat

    SimulationConfig optimal_config = SimulationConfig::default_config();
    optimal_config.location = madrid;
    optimal_config.surface = {35.0, 180.0};  // ~optimal for Madrid

    SimulationResult flat_result = run_simulation(flat_config, tmy);
    SimulationResult optimal_result = run_simulation(optimal_config, tmy);

    printf("  Flat: %.1f kWh, Tilted 35°: %.1f kWh\n",
           flat_result.annual_energy_kwh, optimal_result.annual_energy_kwh);
    assert_true(optimal_result.annual_energy_kwh > flat_result.annual_energy_kwh,
                "35° tilt produces more than flat in Madrid");
}

void test_north_facing_penalty() {
    Location madrid = {40.4168, -3.7038, 650.0};
    std::vector<TMYRecord> tmy = generate_synthetic_tmy(madrid);

    SimulationConfig south = SimulationConfig::default_config();
    south.location = madrid;
    south.surface = {35.0, 180.0};  // south

    SimulationConfig north = SimulationConfig::default_config();
    north.location = madrid;
    north.surface = {35.0, 0.0};  // north

    SimulationResult south_result = run_simulation(south, tmy);
    SimulationResult north_result = run_simulation(north, tmy);

    printf("  South: %.1f kWh, North: %.1f kWh\n",
           south_result.annual_energy_kwh, north_result.annual_energy_kwh);
    assert_true(south_result.annual_energy_kwh > north_result.annual_energy_kwh * 1.2,
                "South-facing produces significantly more than north-facing");
}

int main() {
    printf("=== Simulation Tests ===\n\n");

    test_basic_simulation();
    test_monthly_distribution();
    test_tilt_effect();
    test_north_facing_penalty();

    printf("\n%d/%d tests passed\n", tests_passed, tests_run);
    return (tests_passed == tests_run) ? 0 : 1;
}
