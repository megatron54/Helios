#pragma once

namespace helios {

struct SunPosition {
    double elevation;  // degrees above horizon
    double azimuth;    // degrees from north, clockwise
    double zenith;     // degrees from vertical
    double declination;
    double hour_angle;
    double equation_of_time;  // minutes
};

struct DateTime {
    int year;
    int month;
    int day;
    int hour;
    int minute;
    int second;
    double timezone;  // UTC offset in hours
};

struct Location {
    double latitude;   // degrees, north positive
    double longitude;  // degrees, east positive
    double elevation;  // meters above sea level
};

// Compute sun position using a simplified but accurate algorithm
// based on Jean Meeus "Astronomical Algorithms" and NREL SPA concepts.
// Accuracy: ~0.01 degrees for years 2000-2100.
SunPosition compute_sun_position(const Location& loc, const DateTime& dt);

// Compute sunrise and sunset times (hours UTC) for a given day.
// Returns false if the sun doesn't rise or set (polar regions).
bool compute_sunrise_sunset(const Location& loc, const DateTime& dt,
                            double& sunrise, double& sunset);

// Julian day number from calendar date.
double julian_day(const DateTime& dt);

// Day of year (1-366).
int day_of_year(int year, int month, int day);

}  // namespace helios
