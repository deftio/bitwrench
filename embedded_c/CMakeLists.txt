# ESP-IDF component registration for bitwrench-embedded.
# When this directory is placed under components/, esp-idf auto-discovers it.
# Header-only library — no source files to compile.

idf_component_register(
    INCLUDE_DIRS "."
)
