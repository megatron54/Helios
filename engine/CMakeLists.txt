cmake_minimum_required(VERSION 3.16)
project(helios-engine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(${CMAKE_SOURCE_DIR}/include)

add_library(helios_engine STATIC
    src/solar_position.cpp
    src/irradiance.cpp
    src/panel.cpp
    src/shadow.cpp
    src/simulation.cpp
)

target_include_directories(helios_engine PUBLIC include)

# Tests
enable_testing()
add_executable(test_solar_position tests/test_solar_position.cpp)
target_link_libraries(test_solar_position helios_engine)
add_test(NAME SolarPosition COMMAND test_solar_position)

add_executable(test_irradiance tests/test_irradiance.cpp)
target_link_libraries(test_irradiance helios_engine)
add_test(NAME Irradiance COMMAND test_irradiance)

add_executable(test_panel tests/test_panel.cpp)
target_link_libraries(test_panel helios_engine)
add_test(NAME Panel COMMAND test_panel)

add_executable(test_shadow tests/test_shadow.cpp)
target_link_libraries(test_shadow helios_engine)
add_test(NAME Shadow COMMAND test_shadow)

add_executable(test_simulation tests/test_simulation.cpp)
target_link_libraries(test_simulation helios_engine)
add_test(NAME Simulation COMMAND test_simulation)
