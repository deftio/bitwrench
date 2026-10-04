cmake_minimum_required(VERSION 3.10)
project(bwserve_demo C)

# C99 for inline functions, mixed declarations
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Include the embedded_c headers from repo root
set(BW_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../embedded_c")

if(NOT EXISTS "${BW_INCLUDE_DIR}/bitwrench_embedded.h")
  message(FATAL_ERROR
    "embedded_c/bitwrench_embedded.h is missing.\n"
    "It holds the gzipped bundle this demo serves. Generate it with:\n"
    "  npm run build && npm run build:generated")
endif()

add_executable(bwserve_demo main.c)
target_include_directories(bwserve_demo PRIVATE ${BW_INCLUDE_DIR})

# POSIX threads (needed for multi-client SSE)
find_package(Threads REQUIRED)
target_link_libraries(bwserve_demo Threads::Threads)

# Print build info
message(STATUS "bwserve demo — POSIX socket server")
message(STATUS "bitwrench headers: ${BW_INCLUDE_DIR}")
