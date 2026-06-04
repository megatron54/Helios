#include "irradiance.h"
#include <cmath>
#include <algorithm>

namespace helios {

static constexpr double PI = 3.14159265358979323846;
static constexpr double RAD = PI / 180.0;
static constexpr double SOLAR_CONSTANT = 1361.0;  // W/m2 (updated value)

double extraterrestrial_irradiance(int doy) {
    double B = (2.0 * PI / 365.0) * (doy - 1);
    return SOLAR_CONSTANT * (1.000110 + 0.034221 * cos(B) + 0.001280 * sin(B)
           + 0.000719 * cos(2.0 * B) + 0.000077 * sin(2.0 * B));
}

double air_mass(double solar_zenith) {
    if (solar_zenith >= 90.0) return 40.0;
    double z_rad = solar_zenith * RAD;
    // Kasten-Young (1989) formula
    return 1.0 / (cos(z_rad) + 0.50572 * pow(96.07995 - solar_zenith, -1.6364));
}

double angle_of_incidence(const SunPosition& sun, const TiltedSurface& surface) {
    double tilt_rad = surface.tilt * RAD;
    double surf_az_rad = surface.azimuth * RAD;
    double sun_zen_rad = sun.zenith * RAD;
    double sun_az_rad = sun.azimuth * RAD;

    double cos_aoi = cos(sun_zen_rad) * cos(tilt_rad) +
                     sin(sun_zen_rad) * sin(tilt_rad) * cos(sun_az_rad - surf_az_rad);

    cos_aoi = std::clamp(cos_aoi, -1.0, 1.0);
    return acos(cos_aoi) / RAD;
}

IrradianceComponents transpose_irradiance(
    const HourlyIrradiance& horiz,
    const SunPosition& sun,
    const TiltedSurface& surface,
    double ground_albedo) {

    IrradianceComponents result = {0.0, 0.0, 0.0, 0.0};

    // Sun below horizon: no irradiance on tilted surface
    if (sun.elevation <= 0.0 || horiz.ghi <= 0.0) {
        return result;
    }

    double tilt_rad = surface.tilt * RAD;
    double zenith_rad = sun.zenith * RAD;

    // --- Beam component ---
    double aoi = angle_of_incidence(sun, surface);
    if (aoi < 90.0) {
        double cos_aoi = cos(aoi * RAD);
        double cos_zenith = cos(zenith_rad);
        if (cos_zenith > 0.01) {
            result.beam = horiz.dni * cos_aoi;
        }
    }
    if (result.beam < 0.0) result.beam = 0.0;

    // --- Diffuse component (Perez 1990 model) ---
    int doy = 1;  // approximate, caller should set correctly via sun data
    double I0 = extraterrestrial_irradiance(doy > 0 ? doy : 1);
    double AM = air_mass(sun.zenith);

    // Clearness index (epsilon)
    double epsilon;
    double kappa = 1.041;  // for zenith in radians
    if (horiz.dhi <= 0.0) {
        epsilon = 1.0;
    } else {
        epsilon = ((horiz.dhi + horiz.dni) / horiz.dhi + kappa * zenith_rad * zenith_rad * zenith_rad) /
                  (1.0 + kappa * zenith_rad * zenith_rad * zenith_rad);
    }

    // Brightness index (delta)
    double delta = horiz.dhi * AM / I0;
    if (delta < 0.0) delta = 0.0;

    // Perez coefficients (simplified: use isotropic for very overcast, anisotropic otherwise)
    // Perez brightness coefficients f11, f12, f13, f21, f22, f23
    // Using simplified Hay-Davies model as a practical compromise
    double Rb = 0.0;
    double cos_zenith = cos(zenith_rad);
    if (cos_zenith > 0.01 && horiz.dni > 0.0) {
        double Ai = horiz.dni / I0;  // anisotropy index
        double cos_aoi_val = cos(angle_of_incidence(sun, surface) * RAD);
        if (cos_aoi_val < 0.0) cos_aoi_val = 0.0;
        Rb = cos_aoi_val / cos_zenith;

        // Hay-Davies-Klucher-Reindl (HDKR) model
        double f = sqrt(horiz.dni / horiz.ghi);
        if (std::isnan(f) || std::isinf(f)) f = 0.0;

        result.diffuse = horiz.dhi * (
            (1.0 - Ai) * (1.0 + cos(tilt_rad)) / 2.0 * (1.0 + f * sin(tilt_rad / 2.0) * sin(tilt_rad / 2.0) * sin(tilt_rad / 2.0))
            + Ai * Rb
        );
    } else {
        // Isotropic model for overcast conditions
        result.diffuse = horiz.dhi * (1.0 + cos(tilt_rad)) / 2.0;
    }
    if (result.diffuse < 0.0) result.diffuse = 0.0;

    // --- Ground reflected component ---
    result.reflected = horiz.ghi * ground_albedo * (1.0 - cos(tilt_rad)) / 2.0;
    if (result.reflected < 0.0) result.reflected = 0.0;

    result.global = result.beam + result.diffuse + result.reflected;
    return result;
}

}  // namespace helios
