cmake_minimum_required(VERSION 3.16)
project(helios-wasm VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(ENGINE_DIR ${CMAKE_SOURCE_DIR}/../)
include_directories(${ENGINE_DIR}/include)

add_executable(helios
    ${ENGINE_DIR}/src/solar_position.cpp
    ${ENGINE_DIR}/src/irradiance.cpp
    ${ENGINE_DIR}/src/panel.cpp
    ${ENGINE_DIR}/src/shadow.cpp
    ${ENGINE_DIR}/src/simulation.cpp
    ${ENGINE_DIR}/src/bindings.cpp
)

set_target_properties(helios PROPERTIES SUFFIX ".js")

target_link_options(helios PRIVATE
    --bind
    -sMODULARIZE=1
    -sEXPORT_NAME=createHeliosModule
    -sALLOW_MEMORY_GROWTH=1
    -sENVIRONMENT=web,worker
    -sSINGLE_FILE=0
    -O3
)
