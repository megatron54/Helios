#include "solar_position.h"
#include <cmath>

namespace helios {

static constexpr double PI = 3.14159265358979323846;
static constexpr double RAD = PI / 180.0;
static constexpr double DEG = 180.0 / PI;

double julian_day(const DateTime& dt) {
    int y = dt.year;
    int m = dt.month;
    double d = dt.day + (dt.hour - dt.timezone + dt.minute / 60.0 + dt.second / 3600.0) / 24.0;

    if (m <= 2) {
        y -= 1;
        m += 12;
    }

    int A = y / 100;
    int B = 2 - A + A / 4;

    return static_cast<int>(365.25 * (y + 4716)) +
           static_cast<int>(30.6001 * (m + 1)) + d + B - 1524.5;
}

int day_of_year(int year, int month, int day) {
    static const int days_before[] = {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
    int doy = days_before[month - 1] + day;
    if (month > 2 && (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0))) {
        doy += 1;
    }
    return doy;
}

SunPosition compute_sun_position(const Location& loc, const DateTime& dt) {
    double jd = julian_day(dt);
    double jc = (jd - 2451545.0) / 36525.0;  // Julian century from J2000.0

    // Geometric mean longitude of the sun (degrees)
    double L0 = fmod(280.46646 + jc * (36000.76983 + jc * 0.0003032), 360.0);
    if (L0 < 0) L0 += 360.0;

    // Mean anomaly of the sun (degrees)
    double M = fmod(357.52911 + jc * (35999.05029 - jc * 0.0001537), 360.0);
    if (M < 0) M += 360.0;
    double M_rad = M * RAD;

    // Equation of center
    double C = (1.914602 - jc * (0.004817 + jc * 0.000014)) * sin(M_rad)
             + (0.019993 - jc * 0.000101) * sin(2.0 * M_rad)
             + 0.000289 * sin(3.0 * M_rad);

    // Sun true longitude and true anomaly
    double sun_lon = L0 + C;
    // double sun_anomaly = M + C;

    // Sun apparent longitude
    double omega = 125.04 - 1934.136 * jc;
    double apparent_lon = sun_lon - 0.00569 - 0.00478 * sin(omega * RAD);

    // Mean obliquity of the ecliptic (degrees)
    double obliquity = 23.0 + (26.0 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60.0) / 60.0;
    double obliquity_corr = obliquity + 0.00256 * cos(omega * RAD);
    double obl_rad = obliquity_corr * RAD;

    // Sun declination
    double sin_decl = sin(obl_rad) * sin(apparent_lon * RAD);
    double declination = asin(sin_decl) * DEG;

    // Equation of time (minutes)
    double y2 = tan(obl_rad / 2.0);
    y2 *= y2;
    double L0_rad = L0 * RAD;
    double eot = 4.0 * DEG * (y2 * sin(2.0 * L0_rad)
                 - 2.0 * 0.016709 * sin(M_rad)  // eccentricity approx
                 + 4.0 * 0.016709 * y2 * sin(M_rad) * cos(2.0 * L0_rad)
                 - 0.5 * y2 * y2 * sin(4.0 * L0_rad)
                 - 1.25 * 0.016709 * 0.016709 * sin(2.0 * M_rad));

    // Solar time
    double time_offset = eot + 4.0 * loc.longitude - 60.0 * dt.timezone;  // minutes
    double solar_hour = dt.hour + dt.minute / 60.0 + dt.second / 3600.0;
    double true_solar_time = fmod(solar_hour * 60.0 + time_offset, 1440.0);
    if (true_solar_time < 0) true_solar_time += 1440.0;

    // Hour angle
    double hour_angle = true_solar_time / 4.0 - 180.0;  // degrees
    if (hour_angle < -180.0) hour_angle += 360.0;

    // Solar zenith and elevation
    double lat_rad = loc.latitude * RAD;
    double decl_rad = declination * RAD;
    double ha_rad = hour_angle * RAD;

    double cos_zenith = sin(lat_rad) * sin(decl_rad) +
                        cos(lat_rad) * cos(decl_rad) * cos(ha_rad);
    if (cos_zenith > 1.0) cos_zenith = 1.0;
    if (cos_zenith < -1.0) cos_zenith = -1.0;

    double zenith = acos(cos_zenith) * DEG;
    double elevation = 90.0 - zenith;

    // Atmospheric refraction correction
    double refraction = 0.0;
    if (elevation > 85.0) {
        refraction = 0.0;
    } else if (elevation > 5.0) {
        double te = tan(elevation * RAD);
        refraction = 58.1 / te - 0.07 / (te * te * te) + 0.000086 / (te * te * te * te * te);
    } else if (elevation > -0.575) {
        refraction = 1735.0 + elevation * (-518.2 + elevation * (103.4 + elevation * (-12.79 + elevation * 0.711)));
    } else {
        refraction = -20.772 / tan(elevation * RAD);
    }
    refraction /= 3600.0;  // arc-seconds to degrees
    elevation += refraction;

    // Solar azimuth (from north, clockwise)
    double azimuth;
    if (hour_angle > 0) {
        azimuth = fmod(acos((sin(lat_rad) * cos_zenith - sin(decl_rad)) /
                  (cos(lat_rad) * sin(zenith * RAD))) * DEG + 180.0, 360.0);
    } else {
        azimuth = fmod(540.0 - acos((sin(lat_rad) * cos_zenith - sin(decl_rad)) /
                  (cos(lat_rad) * sin(zenith * RAD))) * DEG, 360.0);
    }

    SunPosition pos;
    pos.elevation = elevation;
    pos.azimuth = azimuth;
    pos.zenith = zenith;
    pos.declination = declination;
    pos.hour_angle = hour_angle;
    pos.equation_of_time = eot;
    return pos;
}

bool compute_sunrise_sunset(const Location& loc, const DateTime& dt,
                            double& sunrise, double& sunset) {
    // Compute solar noon to get declination for the day
    DateTime noon = dt;
    noon.hour = 12;
    noon.minute = 0;
    noon.second = 0;

    SunPosition noon_pos = compute_sun_position(loc, noon);
    double decl_rad = noon_pos.declination * RAD;
    double lat_rad = loc.latitude * RAD;

    // Hour angle at sunrise/sunset (solar elevation = -0.833 deg for standard)
    double cos_ha = (sin(-0.833 * RAD) - sin(lat_rad) * sin(decl_rad)) /
                    (cos(lat_rad) * cos(decl_rad));

    if (cos_ha > 1.0) return false;   // sun never rises
    if (cos_ha < -1.0) return false;   // sun never sets

    double ha = acos(cos_ha) * DEG;  // degrees

    // Convert to time using equation of time
    double solar_noon = (720.0 - 4.0 * loc.longitude - noon_pos.equation_of_time + dt.timezone * 60.0) / 60.0;
    sunrise = solar_noon - ha / 15.0;  // hours
    sunset = solar_noon + ha / 15.0;   // hours

    return true;
}

}  // namespace helios
