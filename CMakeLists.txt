# ESP-IDF component registration.
# This file is used when bitwrench is consumed as an ESP-IDF component
# (via the ESP Component Registry or as a managed/local component).
# It is ignored by Arduino IDE, PlatformIO, npm, and plain Make builds.
# Header-only library — no source files to compile.

if(ESP_PLATFORM)
    idf_component_register(
        INCLUDE_DIRS "embedded_c"
    )
endif()
