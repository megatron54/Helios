#include "shadow.h"
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

void test_sun_direction_vector() {
    // Sun directly overhead: direction should be (0, 0, -1)
    SunPosition overhead = {90.0, 0.0, 0.0, 0, 0, 0};
    Vec3 dir = sun_direction_vector(overhead);
    assert_near(dir.z, -1.0, 0.01, "Overhead sun: z = -1");
    assert_near(dir.x, 0.0, 0.01, "Overhead sun: x = 0");

    // Sun from south at 45° elevation
    SunPosition south45 = {45.0, 180.0, 45.0, 0, 0, 0};
    Vec3 dir2 = sun_direction_vector(south45);
    assert_true(dir2.y > 0.0, "Sun from south: y-component positive (toward north)");
    assert_true(dir2.z < 0.0, "Sun above: z-component negative (downward)");
}

void test_no_obstacles() {
    PanelGrid grid;
    grid.origin = {0.0, 0.0, 2.5};
    grid.tilt = 35.0;
    grid.azimuth = 180.0;
    grid.rows = 4;
    grid.cols = 4;
    grid.total_width = 4.0;
    grid.total_height = 3.0;

    std::vector<Obstacle> empty;
    SunPosition sun = {45.0, 180.0, 45.0, 0, 0, 0};

    double shading = compute_shading_fraction(grid, empty, sun);
    assert_near(shading, 0.0, 0.001, "No obstacles -> no shading");
}

void test_full_shade() {
    // Place a huge obstacle directly south, taller than panels
    PanelGrid grid;
    grid.origin = {0.0, 0.0, 2.5};
    grid.tilt = 35.0;
    grid.azimuth = 180.0;
    grid.rows = 4;
    grid.cols = 4;
    grid.total_width = 4.0;
    grid.total_height = 3.0;

    // Large wall to the south, very close
    Obstacle wall;
    wall.position = {2.0, -3.0, 0.0};  // south of panels
    wall.width = 20.0;
    wall.depth = 1.0;
    wall.height = 15.0;

    std::vector<Obstacle> obstacles = {wall};
    // Sun from south at low elevation (will hit the wall)
    SunPosition sun = {20.0, 180.0, 70.0, 0, 0, 0};

    double shading = compute_shading_fraction(grid, obstacles, sun);
    assert_true(shading > 0.5, "Large south wall at low sun -> significant shading");
}

void test_sun_below_horizon() {
    PanelGrid grid;
    grid.origin = {0.0, 0.0, 2.5};
    grid.tilt = 35.0;
    grid.azimuth = 180.0;
    grid.rows = 4;
    grid.cols = 4;
    grid.total_width = 4.0;
    grid.total_height = 3.0;

    Obstacle obs;
    obs.position = {2.0, -2.0, 0.0};
    obs.width = 2.0;
    obs.depth = 2.0;
    obs.height = 5.0;

    std::vector<Obstacle> obstacles = {obs};
    SunPosition sun = {-5.0, 180.0, 95.0, 0, 0, 0};  // below horizon

    double shading = compute_shading_fraction(grid, obstacles, sun);
    assert_near(shading, 1.0, 0.001, "Sun below horizon -> fully shaded");
}

void test_obstacle_behind_panels() {
    // Obstacle to the north, sun from south -> no shadow on south-facing panels
    PanelGrid grid;
    grid.origin = {0.0, 0.0, 2.5};
    grid.tilt = 35.0;
    grid.azimuth = 180.0;
    grid.rows = 4;
    grid.cols = 4;
    grid.total_width = 4.0;
    grid.total_height = 3.0;

    Obstacle behind;
    behind.position = {2.0, 5.0, 0.0};  // north of panels
    behind.width = 4.0;
    behind.depth = 1.0;
    behind.height = 5.0;

    std::vector<Obstacle> obstacles = {behind};
    SunPosition sun = {45.0, 180.0, 45.0, 0, 0, 0};  // from south

    double shading = compute_shading_fraction(grid, obstacles, sun);
    assert_near(shading, 0.0, 0.01, "Obstacle behind panels (north) with south sun -> no shade");
}

int main() {
    printf("=== Shadow Engine Tests ===\n\n");

    test_sun_direction_vector();
    test_no_obstacles();
    test_full_shade();
    test_sun_below_horizon();
    test_obstacle_behind_panels();

    printf("\n%d/%d tests passed\n", tests_passed, tests_run);
    return (tests_passed == tests_run) ? 0 : 1;
}
