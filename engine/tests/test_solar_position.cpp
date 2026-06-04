#include "solar_position.h"
#include <cstdio>
#include <cmath>
#include <cstdlib>

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

void test_julian_day() {
    // J2000.0 epoch: 2000-01-01 12:00 UT = JD 2451545.0
    DateTime dt = {2000, 1, 1, 12, 0, 0, 0.0};
    assert_near(julian_day(dt), 2451545.0, 0.001, "J2000.0 epoch");

    // 2023-06-21 12:00 UT (summer solstice)
    DateTime dt2 = {2023, 6, 21, 12, 0, 0, 0.0};
    assert_near(julian_day(dt2), 2460117.0, 0.001, "2023 summer solstice JD");
}

void test_day_of_year() {
    tests_run++;
    if (day_of_year(2023, 1, 1) == 1) tests_passed++;
    else printf("FAIL: Jan 1 should be DOY 1\n");

    tests_run++;
    if (day_of_year(2023, 12, 31) == 365) tests_passed++;
    else printf("FAIL: Dec 31 non-leap should be DOY 365\n");

    tests_run++;
    if (day_of_year(2024, 12, 31) == 366) tests_passed++;
    else printf("FAIL: Dec 31 leap year should be DOY 366\n");

    tests_run++;
    if (day_of_year(2023, 3, 21) == 80) tests_passed++;
    else printf("FAIL: Mar 21 should be DOY 80, got %d\n", day_of_year(2023, 3, 21));
}

void test_solar_position_madrid_summer_noon() {
    // Madrid (40.4168°N, -3.7038°W), 2023-06-21 12:00 UTC
    // Expected: elevation ~72°, azimuth ~180° (south)
    Location madrid = {40.4168, -3.7038, 650.0};
    DateTime dt = {2023, 6, 21, 12, 0, 0, 0.0};

    SunPosition pos = compute_sun_position(madrid, dt);
    assert_near(pos.elevation, 73.0, 2.0, "Madrid summer solstice noon elevation");
    assert_near(pos.azimuth, 180.0, 15.0, "Madrid summer solstice noon azimuth ~south");
}

void test_solar_position_madrid_winter_noon() {
    // Madrid, 2023-12-21 12:00 UTC (winter solstice)
    // Expected: elevation ~27°, azimuth ~180°
    Location madrid = {40.4168, -3.7038, 650.0};
    DateTime dt = {2023, 12, 21, 12, 0, 0, 0.0};

    SunPosition pos = compute_sun_position(madrid, dt);
    assert_near(pos.elevation, 27.0, 2.0, "Madrid winter solstice noon elevation");
    assert_near(pos.azimuth, 180.0, 15.0, "Madrid winter solstice noon azimuth ~south");
}

void test_solar_position_equator_equinox() {
    // Equator, equinox (March 20), solar noon
    // Expected: elevation ~90° (sun directly overhead)
    Location equator = {0.0, 0.0, 0.0};
    DateTime dt = {2023, 3, 20, 12, 0, 0, 0.0};

    SunPosition pos = compute_sun_position(equator, dt);
    assert_near(pos.elevation, 90.0, 3.0, "Equator equinox noon elevation ~90");
}

void test_sunrise_sunset_madrid() {
    Location madrid = {40.4168, -3.7038, 650.0};
    DateTime dt = {2023, 6, 21, 12, 0, 0, 0.0};

    double sunrise, sunset;
    bool has_sun = compute_sunrise_sunset(madrid, dt, sunrise, sunset);

    tests_run++;
    if (has_sun) tests_passed++;
    else printf("FAIL: Madrid should have sunrise/sunset in summer\n");

    // Summer solstice in Madrid: sunrise ~4:45 UTC, sunset ~19:45 UTC
    // (Madrid is at longitude -3.7°, UTC+0 in this test, so solar times are earlier)
    assert_near(sunrise, 4.75, 0.75, "Madrid summer sunrise ~4:45 UTC");
    assert_near(sunset, 19.8, 0.75, "Madrid summer sunset ~19:48 UTC");
    assert_near(sunset - sunrise, 15.0, 1.0, "Madrid summer day length ~15h");
}

int main() {
    printf("=== Solar Position Tests ===\n\n");

    test_julian_day();
    test_day_of_year();
    test_solar_position_madrid_summer_noon();
    test_solar_position_madrid_winter_noon();
    test_solar_position_equator_equinox();
    test_sunrise_sunset_madrid();

    printf("\n%d/%d tests passed\n", tests_passed, tests_run);
    return (tests_passed == tests_run) ? 0 : 1;
}
