#include "panel.h"
#include <cstdio>
#include <cmath>

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

void test_cell_temperature() {
    // STC-like conditions: 25°C ambient, 1000 W/m2, NOCT 45
    double temp = cell_temperature(25.0, 1000.0, 45.0);
    assert_near(temp, 56.25, 1.0, "Cell temp at STC-like: ~56°C");

    // No irradiance: cell temp = ambient
    double temp_night = cell_temperature(15.0, 0.0, 45.0);
    assert_near(temp_night, 15.0, 0.01, "Cell temp at night = ambient");

    // Higher irradiance = higher temp
    double temp_high = cell_temperature(30.0, 1200.0, 45.0);
    assert_true(temp_high > temp, "Higher irradiance -> higher cell temp");
}

void test_iam_ashrae() {
    // Normal incidence: IAM = 1.0
    assert_near(iam_ashrae(0.0), 1.0, 0.001, "IAM at 0° = 1.0");

    // 60° incidence: slight reduction
    double iam60 = iam_ashrae(60.0);
    assert_true(iam60 > 0.85 && iam60 < 1.0, "IAM at 60° between 0.85-1.0");

    // 90° incidence: IAM = 0
    assert_near(iam_ashrae(90.0), 0.0, 0.001, "IAM at 90° = 0.0");

    // Monotonically decreasing
    assert_true(iam_ashrae(30.0) > iam_ashrae(60.0), "IAM decreases with angle");
}

void test_panel_output_stc() {
    // At STC conditions (1000 W/m2, 25°C cell temp -> 0°C ambient for NOCT 45 and 800 W/m2)
    // With AOI = 0, we should get close to rated power
    PanelSpec panel = PanelSpec::default_panel();
    SystemLosses losses = SystemLosses::default_losses();

    PanelOutput out = compute_panel_output(1000.0, 20.0, 0.0, panel, losses);

    // 10 panels * 400Wp = 4000W peak
    // But with temp correction (cell will be > 25°C) and losses, expect less
    assert_true(out.ac_power > 2500.0, "AC power at near-STC > 2500W");
    assert_true(out.ac_power < 4000.0, "AC power at near-STC < 4000W (losses)");
    assert_true(out.dc_power > out.ac_power, "DC > AC (inverter + losses)");
}

void test_panel_output_no_irradiance() {
    PanelSpec panel = PanelSpec::default_panel();
    SystemLosses losses = SystemLosses::default_losses();

    PanelOutput out = compute_panel_output(0.0, 20.0, 0.0, panel, losses);
    assert_near(out.ac_power, 0.0, 0.001, "No output at zero irradiance");
}

void test_panel_output_high_aoi() {
    PanelSpec panel = PanelSpec::default_panel();
    SystemLosses losses = SystemLosses::default_losses();

    // At 85° AOI, IAM should reduce output significantly
    PanelOutput out = compute_panel_output(1000.0, 20.0, 85.0, panel, losses);
    PanelOutput out_normal = compute_panel_output(1000.0, 20.0, 0.0, panel, losses);

    assert_true(out.ac_power < out_normal.ac_power * 0.5, "High AOI reduces output substantially");
}

void test_temperature_effect() {
    PanelSpec panel = PanelSpec::default_panel();
    SystemLosses losses = SystemLosses::default_losses();

    PanelOutput out_cool = compute_panel_output(1000.0, 10.0, 0.0, panel, losses);
    PanelOutput out_hot = compute_panel_output(1000.0, 40.0, 0.0, panel, losses);

    assert_true(out_cool.ac_power > out_hot.ac_power, "Cooler ambient -> more power");
    assert_true(out_cool.cell_temp < out_hot.cell_temp, "Cooler ambient -> lower cell temp");
}

int main() {
    printf("=== Panel Model Tests ===\n\n");

    test_cell_temperature();
    test_iam_ashrae();
    test_panel_output_stc();
    test_panel_output_no_irradiance();
    test_panel_output_high_aoi();
    test_temperature_effect();

    printf("\n%d/%d tests passed\n", tests_passed, tests_run);
    return (tests_passed == tests_run) ? 0 : 1;
}
