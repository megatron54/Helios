#include "shadow.h"
#include <cmath>
#include <algorithm>

namespace helios {

static constexpr double PI = 3.14159265358979323846;
static constexpr double RAD = PI / 180.0;

Vec3 sun_direction_vector(const SunPosition& sun) {
    double elev_rad = sun.elevation * RAD;
    double az_rad = sun.azimuth * RAD;

    // Direction FROM the sun (pointing toward ground).
    // Azimuth: 0=north, 90=east, 180=south, 270=west
    Vec3 dir;
    dir.x = -cos(elev_rad) * sin(az_rad);
    dir.y = -cos(elev_rad) * cos(az_rad);
    dir.z = -sin(elev_rad);
    return dir;
}

// Ray-box intersection test (axis-aligned bounding box)
static bool ray_intersects_box(const Vec3& origin, const Vec3& dir,
                               const Obstacle& obs) {
    // Box bounds
    double min_x = obs.position.x - obs.width / 2.0;
    double max_x = obs.position.x + obs.width / 2.0;
    double min_y = obs.position.y - obs.depth / 2.0;
    double max_y = obs.position.y + obs.depth / 2.0;
    double min_z = 0.0;
    double max_z = obs.height;

    double tmin = -1e30, tmax = 1e30;

    // X slab
    if (std::abs(dir.x) > 1e-10) {
        double t1 = (min_x - origin.x) / dir.x;
        double t2 = (max_x - origin.x) / dir.x;
        if (t1 > t2) std::swap(t1, t2);
        tmin = std::max(tmin, t1);
        tmax = std::min(tmax, t2);
    } else if (origin.x < min_x || origin.x > max_x) {
        return false;
    }

    // Y slab
    if (std::abs(dir.y) > 1e-10) {
        double t1 = (min_y - origin.y) / dir.y;
        double t2 = (max_y - origin.y) / dir.y;
        if (t1 > t2) std::swap(t1, t2);
        tmin = std::max(tmin, t1);
        tmax = std::min(tmax, t2);
    } else if (origin.y < min_y || origin.y > max_y) {
        return false;
    }

    // Z slab
    if (std::abs(dir.z) > 1e-10) {
        double t1 = (min_z - origin.z) / dir.z;
        double t2 = (max_z - origin.z) / dir.z;
        if (t1 > t2) std::swap(t1, t2);
        tmin = std::max(tmin, t1);
        tmax = std::min(tmax, t2);
    } else if (origin.z < min_z || origin.z > max_z) {
        return false;
    }

    // Intersection exists if tmax > tmin and the intersection is in the
    // ray direction (tmax > 0, but we also need the obstacle to be between
    // the sun and the point — t should be negative since we trace toward sun)
    return tmax >= tmin && tmax > 0.0;
}

bool point_is_shaded(const Vec3& point,
                     const std::vector<Obstacle>& obstacles,
                     const Vec3& sun_dir) {
    // Trace ray from point TOWARD the sun (opposite of sun_dir)
    Vec3 to_sun = {-sun_dir.x, -sun_dir.y, -sun_dir.z};

    for (const auto& obs : obstacles) {
        if (ray_intersects_box(point, to_sun, obs)) {
            return true;
        }
    }
    return false;
}

double compute_shading_fraction(
    const PanelGrid& panel,
    const std::vector<Obstacle>& obstacles,
    const SunPosition& sun) {

    if (sun.elevation <= 0.0) return 1.0;  // sun below horizon
    if (obstacles.empty()) return 0.0;

    Vec3 sun_dir = sun_direction_vector(sun);
    int shaded_count = 0;
    int total_points = panel.rows * panel.cols;

    if (total_points == 0) return 0.0;

    double tilt_rad = panel.tilt * RAD;
    double az_rad = panel.azimuth * RAD;

    // Generate sample points on the tilted panel surface
    for (int r = 0; r < panel.rows; ++r) {
        for (int c = 0; c < panel.cols; ++c) {
            // Normalized position on panel [0,1]
            double u = (panel.rows > 1) ? static_cast<double>(r) / (panel.rows - 1) : 0.5;
            double v = (panel.cols > 1) ? static_cast<double>(c) / (panel.cols - 1) : 0.5;

            // Local position on panel plane
            double local_x = u * panel.total_width;
            double local_y = v * panel.total_height;

            // Transform to world coordinates considering tilt and azimuth
            // Panel faces azimuth direction, tilted from horizontal
            double sin_az = sin(az_rad);
            double cos_az = cos(az_rad);
            double sin_tilt = sin(tilt_rad);
            double cos_tilt = cos(tilt_rad);

            Vec3 point;
            point.x = panel.origin.x + local_x * cos_az - local_y * sin_az * cos_tilt;
            point.y = panel.origin.y + local_x * sin_az + local_y * cos_az * cos_tilt;
            point.z = panel.origin.z + local_y * sin_tilt;

            if (point_is_shaded(point, obstacles, sun_dir)) {
                shaded_count++;
            }
        }
    }

    return static_cast<double>(shaded_count) / total_points;
}

}  // namespace helios
