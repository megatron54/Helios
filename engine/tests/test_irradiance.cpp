#include "irradiance.h"
#include "solar_position.h"
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

void test_extraterrestrial_irradiance() {
    // Perihelion (around Jan 3): should be slightly above solar constant
    double jan = extraterrestrial_irradiance(3);
    assert_near(jan, 1412.0, 20.0, "Extraterrestrial Jan ~1412 W/m2");

    // Aphelion (around Jul 4): should be slightly below solar constant
    double jul = extraterrestrial_irradiance(185);
    assert_near(jul, 1321.0, 20.0, "Extraterrestrial Jul ~1321 W/m2");

    assert_true(jan > jul, "January ETR > July ETR");
}

void test_air_mass() {
    // Zenith = 0 -> AM = 1
    assert_near(air_mass(0.0), 1.0, 0.01, "AM at zenith = 1.0");

    // Zenith = 60 -> AM ~ 2
    assert_near(air_mass(60.0), 2.0, 0.05, "AM at 60° zenith ~ 2.0");

    // Zenith = 85 -> AM ~ 10-12
    double am85 = air_mass(85.0);
    assert_true(am85 > 8.0 && am85 < 15.0, "AM at 85° between 8 and 15");

    // Zenith >= 90 -> clamped
    assert_near(air_mass(90.0), 40.0, 0.1, "AM at 90° clamped to 40");
}

void test_angle_of_incidence() {
    // Sun directly overhead (zenith=0), panel flat (tilt=0) -> AOI = 0
    SunPosition sun = {90.0, 180.0, 0.0, 0, 0, 0};
    TiltedSurface flat = {0.0, 180.0};
    assert_near(angle_of_incidence(sun, flat), 0.0, 1.0, "AOI: sun overhead, flat panel = 0");

    // Sun at 45° elevation from south, panel 45° tilt facing south -> AOI ~ 0
    SunPosition sun45 = {45.0, 180.0, 45.0, 0, 0, 0};
    TiltedSurface tilt45 = {45.0, 180.0};
    assert_near(angle_of_incidence(sun45, tilt45), 0.0, 2.0, "AOI: sun 45° south, panel 45° south ~ 0");

    // Sun from east, panel facing south -> AOI should be ~90
    SunPosition sun_east = {45.0, 90.0, 45.0, 0, 0, 0};
    TiltedSurface south = {90.0, 180.0};
    double aoi = angle_of_incidence(sun_east, south);
    assert_true(aoi > 60.0, "AOI: sun from east, panel facing south > 60°");
}

void test_transpose_irradiance_clear_day() {
    // Typical clear day conditions: GHI=800, DNI=700, DHI=150
    HourlyIrradiance horiz = {800.0, 700.0, 150.0};
    SunPosition sun = {50.0, 180.0, 40.0, 0, 0, 0};  // 50° elevation, south
    TiltedSurface surface = {35.0, 180.0};  // 35° tilt, south

    IrradianceComponents result = transpose_irradiance(horiz, sun, surface, 0.2);

    assert_true(result.global > 0.0, "POA irradiance > 0 on clear day");
    assert_true(result.beam > result.diffuse, "Beam > diffuse on clear day");
    assert_true(result.global > horiz.ghi * 0.8, "POA should be substantial on good orientation");
    assert_true(result.reflected > 0.0, "Ground reflected > 0 with albedo 0.2");
    assert_true(result.global < 1400.0, "POA should not exceed extraterrestrial");
}

void test_transpose_night() {
    HourlyIrradiance horiz = {0.0, 0.0, 0.0};
    SunPosition sun = {-10.0, 0.0, 100.0, 0, 0, 0};  // below horizon
    TiltedSurface surface = {35.0, 180.0};

    IrradianceComponents result = transpose_irradiance(horiz, sun, surface, 0.2);
    assert_near(result.global, 0.0, 0.01, "No irradiance at night");
}

int main() {
    printf("=== Irradiance Model Tests ===\n\n");

    test_extraterrestrial_irradiance();
    test_air_mass();
    test_angle_of_incidence();
    test_transpose_irradiance_clear_day();
    test_transpose_night();

    printf("\n%d/%d tests passed\n", tests_passed, tests_run);
    return (tests_passed == tests_run) ? 0 : 1;
}
