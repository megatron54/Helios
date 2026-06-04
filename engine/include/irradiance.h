#pragma once

#include "solar_position.h"

namespace helios {

struct IrradianceComponents {
    double beam;       // Direct/beam irradiance on tilted surface (W/m2)
    double diffuse;    // Diffuse irradiance on tilted surface (W/m2)
    double reflected;  // Ground-reflected irradiance on tilted surface (W/m2)
    double global;     // Total = beam + diffuse + reflected (W/m2)
};

struct TiltedSurface {
    double tilt;     // degrees from horizontal (0 = flat, 90 = vertical)
    double azimuth;  // degrees from north, clockwise (180 = south-facing in NH)
};

struct HourlyIrradiance {
    double ghi;   // Global Horizontal Irradiance (W/m2)
    double dni;   // Direct Normal Irradiance (W/m2)
    double dhi;   // Diffuse Horizontal Irradiance (W/m2)
};

// Transpose horizontal irradiance onto a tilted surface using the Perez model.
IrradianceComponents transpose_irradiance(
    const HourlyIrradiance& horizontal,
    const SunPosition& sun,
    const TiltedSurface& surface,
    double ground_albedo = 0.2);

// Compute angle of incidence between sun rays and panel normal (degrees).
double angle_of_incidence(const SunPosition& sun, const TiltedSurface& surface);

// Compute extraterrestrial irradiance for a given day of year (W/m2).
double extraterrestrial_irradiance(int day_of_year);

// Air mass calculation (Kasten-Young model).
double air_mass(double solar_zenith);

}  // namespace helios
