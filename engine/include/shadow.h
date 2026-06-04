#pragma once

#include "solar_position.h"
#include <vector>

namespace helios {

struct Vec3 {
    double x, y, z;
};

struct Obstacle {
    Vec3 position;   // center of base
    double width;    // x-dimension (meters)
    double depth;    // y-dimension (meters)
    double height;   // z-dimension (meters)
};

struct PanelGrid {
    Vec3 origin;          // bottom-left corner of the panel array
    double tilt;          // degrees from horizontal
    double azimuth;       // degrees from north
    int rows;             // number of sample points along width
    int cols;             // number of sample points along height
    double total_width;   // meters
    double total_height;  // meters
};

// Compute shading fraction (0.0 = no shade, 1.0 = fully shaded)
// for a panel grid given obstacles and sun position.
double compute_shading_fraction(
    const PanelGrid& panel,
    const std::vector<Obstacle>& obstacles,
    const SunPosition& sun);

// Check if a single point is shaded by any obstacle.
bool point_is_shaded(
    const Vec3& point,
    const std::vector<Obstacle>& obstacles,
    const Vec3& sun_direction);

// Compute sun direction vector from sun position angles.
Vec3 sun_direction_vector(const SunPosition& sun);

}  // namespace helios
