cmake_minimum_required(VERSION 3.10)
project(bwserve_cpp CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# The same headers an Arduino sketch includes. Nothing is copied into this
# example: if the headers change, this demo changes with them.
set(BW_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../embedded_c")

if(NOT EXISTS "${BW_INCLUDE_DIR}/bitwrench_embedded.h")
  message(FATAL_ERROR
    "embedded_c/bitwrench_embedded.h is missing.\n"
    "It holds the gzipped bundle this demo serves. Generate it with:\n"
    "  npm run build && npm run build:generated")
endif()

add_executable(bwserve_cpp main.cpp)
target_include_directories(bwserve_cpp PRIVATE ${BW_INCLUDE_DIR})

if(WIN32)
  target_link_libraries(bwserve_cpp ws2_32)
endif()

message(STATUS "bitwrench C++ demo -- headers: ${BW_INCLUDE_DIR}")
