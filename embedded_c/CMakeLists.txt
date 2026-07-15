# ESP-IDF component registration for the bitwrench C headers.
# When this directory is copied under a project's components/ dir,
# esp-idf auto-discovers it. (When installing from the ESP Component
# Registry, the repo-root CMakeLists.txt is used instead.)
# Header-only library — no source files to compile.

idf_component_register(
    INCLUDE_DIRS "."
)
