/**
 * bwserve_cpp — a bitwrench web app written in C++, running on your laptop.
 *
 * This is the ESP32 sketch next door (../esp32_dashboard/esp32_dashboard.ino) with the transport
 * swapped: POSIX sockets instead of WiFi + ESPAsyncWebServer. Everything
 * above the transport -- the embedded bundle in flash, the protocol frames,
 * the client registry, the post-back parsing -- is the same code, from the
 * same headers. Port it to a board by replacing main() and serve_*(), not by
 * rewriting the app.
 *
 *   cmake -B build && cmake --build build && ./build/bwserve_cpp
 *   open http://localhost:8080
 *
 * What it demonstrates, in the order a reader meets it:
 *
 *   1. GET /bitwrench.js       served from bitwrench_embedded.h (flash), with
 *                              Content-Encoding: gzip. No CDN, no filesystem,
 *                              works on an air-gapped network.
 *   2. GET /                   an eight-line bootstrap page. It has no UI in
 *                              it: just load bitwrench, enable actions, and
 *                              connect. The C++ side owns the UI.
 *   3. GET /bw/events          SSE. On connect, the server mounts the whole
 *                              page with bwserve::mount(); then it patches
 *                              values every second.
 *   4. POST /bw/events         what bw.actions sends when a bw_act_* element
 *                              is clicked. bw_parse_action() reads it.
 *
 * There is no hand-written DOM code anywhere, in C++ or in the page. That is
 * the point: a device that can print a string can drive a bitwrench UI.
 *
 * License: BSD-2-Clause
 */

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <csignal>
#include <ctime>
#include <string>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#define BW_CLOSE(s) closesocket(s)
#else
#include <unistd.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#define BW_CLOSE(s) close(s)
#endif

// Room for the whole bootstrap page in one frame. A board with less RAM can
// drop this to 512 and send the page in chunks.
#define BW_BUF_SIZE 2048
#define BW_MAX_CLIENTS 8

#include "bitwrench.h"
#include "bwserve.h"
#include "bitwrench_embedded.h"   // generated: npm run build:generated

static const int PORT = 8080;

// ─────────────────────────────────────────────────────────────────────────────
// Device state. On a board these would be ADC reads and a GPIO level.
// ─────────────────────────────────────────────────────────────────────────────

struct Device {
    double temperature;
    int    humidity;
    bool   led;
    long   uptime;
    long   clicks;
    char   label[33];   /* typed in the browser, echoed back by the device */
    int    rate;        /* seconds between pushes, chosen in the browser   */
};

static Device g_dev = { 22.0, 55, false, 0, 0, "Bench unit 1", 1 };
static bw_clients_t g_clients;
static volatile sig_atomic_t g_running = 1;

static void on_signal(int) { g_running = 0; }

// ─────────────────────────────────────────────────────────────────────────────
// The UI, built in C++ as TACO strings.
//
// bw::taco() and friends emit the same {t,a,c} objects a browser-side
// bw.create() call would take. The device is not sending HTML and not sending
// code: it sends a component description, and bitwrench renders it.
// ─────────────────────────────────────────────────────────────────────────────

/* The LED alert's text and styling both follow one bool, so both are derived
 * in one place -- the mount and the later patch cannot disagree. */
static const char *led_text() { return g_dev.led ? "LED is ON" : "LED is off"; }
static const char *led_btn_text() { return g_dev.led ? "LED off" : "LED on"; }
static std::string led_class() {
    return std::string("bw_bccl_alert bw_mt_3 ") +
           (g_dev.led ? "bw_bccl_alert_success" : "bw_bccl_alert_info");
}

/* The title carries the label the browser typed, so the echo is visible. */
static std::string title_text() {
    return std::string(g_dev.label) + " -- C++ on this machine";
}

/* One <option>, marked selected when it matches the device's current rate.
 * `selected` is an attribute like any other; there is no special casing. */
static std::string rate_option(int seconds) {
    char val[8], text[16];
    std::snprintf(val, sizeof val, "%d", seconds);
    std::snprintf(text, sizeof text, "every %ds", seconds);
    std::string attrs = std::string("'value':'") + val + "'";
    if (g_dev.rate == seconds) attrs += ",'selected':'selected'";
    return bw::taco_attr("option", attrs, text);
}

/**
 * One labelled reading, as a card.
 *
 * `id` is the handle later patches address -- the device names what it will
 * want to change, once, when it builds the node. There is no diffing on
 * either side because neither side needs to guess.
 */
static std::string stat_card(const char *id, const char *label, const char *value) {
    return bw::nest("div", "bw_col_6 bw_col_md_3",
        bw::nest("div", "bw_bccl_card bw_p_3", bw::array({
            bw::taco("div", "bw_text_muted bw_text_sm", label),
            bw::taco_attr("div", std::string("'class':'bw_text_2xl bw_fw_bold','id':'") + id + "'", value)
        })));
}

/** The whole page, mounted once per connected browser. */
static std::string dashboard() {
    char temp[16], hum[16], up[16], clicks[16];
    std::snprintf(temp, sizeof temp, "%.1f C", g_dev.temperature);
    std::snprintf(hum, sizeof hum, "%d %%", g_dev.humidity);
    std::snprintf(up, sizeof up, "%lds", g_dev.uptime);
    std::snprintf(clicks, sizeof clicks, "%ld", g_dev.clicks);

    std::string cards = bw::nest("div", "bw_row bw_g_3", bw::array({
        stat_card("temp", "Temperature", temp),
        stat_card("humidity", "Humidity", hum),
        stat_card("uptime", "Uptime", up),
        stat_card("clicks", "Clicks", clicks)
    }));

    // bw_act_* is the whole event wiring. bw.actions.enable() on the page
    // turns a click on this button into a post-back carrying "led_toggle".
    // No onclick, no handler shipped over the wire, no code from the device.
    std::string buttons = bw::nest("div", "bw_mt_3", bw::array({
        bw::taco_attr("button",
            "'class':'bw_bccl_btn bw_bccl_btn_primary bw_act_led_toggle','id':'led_btn'",
            led_btn_text()),
        bw::taco_attr("button", "'class':'bw_bccl_btn bw_bccl_btn_secondary bw_ml_2 bw_act_reset'",
                      "Reset uptime")
    }));

    std::string led = bw::taco_attr("div", std::string("'class':'") + led_class() +
        "','id':'led'", led_text());

    // Values coming the other way. bw.actions sends an input's or select's
    // `value` with the action, so a device reads user input with no handler,
    // no form submit and no JSON parser. `name` rides along too.
    //
    // Note the input is seeded with the current value: the device is the
    // source of truth, so a browser that reconnects sees what the device
    // thinks the label is, not an empty box.
    std::string controls = bw::nest("div", "bw_row bw_g_3 bw_mt_3", bw::array({
        bw::nest("div", "bw_col_12 bw_col_md_6", bw::nest("div", "bw_bccl_form_group",
            bw::array({
                bw::taco("label", "bw_bccl_form_label", "Device label"),
                bw::taco_attr("input",
                    std::string("'class':'bw_bccl_form_control bw_act_set_label',"
                                "'name':'label','id':'label_in','value':'") +
                    bw::escape(g_dev.label) + "'", "")
            }))),
        bw::nest("div", "bw_col_12 bw_col_md_6", bw::nest("div", "bw_bccl_form_group",
            bw::array({
                bw::taco("label", "bw_bccl_form_label", "Push interval"),
                bw::nest_attr("select",
                    "'class':'bw_bccl_form_select bw_act_set_rate','name':'rate'",
                    bw::array({ rate_option(1), rate_option(2), rate_option(5) }))
            })))
    }));

    return bw::nest("div", "bw_bccl_container bw_py_4", bw::array({
        bw::taco_attr("h1", "'class':'bw_mb_1','id':'title'", title_text().c_str()),
        bw::taco("p", "bw_text_muted", "Served from flash, driven over SSE. No framework, no build step."),
        cards, controls, buttons, led,
        // Where device notifications land. The page routes bw:message here.
        bw::taco_attr("div", "'class':'bw_text_muted bw_text_sm bw_mt_2','id':'status'",
                      "ready")
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP. Everything below here is the part you replace per platform.
// ─────────────────────────────────────────────────────────────────────────────

static const char BOOTSTRAP[] =
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
    "<title>bitwrench C++ demo</title>"
    "<script src=\"/bitwrench.js\"></script></head>"
    "<body><div id=\"app\"></div><script>\n"
    "  bw.loadStyles({ primary: '#0b7285', mode: 'auto' });\n"
    "  bw.actions.enable();        // bw_act_* events post back to the server\n"
    "  bw.connect('/bw/events');   // the server mounts and patches from here\n"
    "  // A device notification is published, not rendered -- the page decides\n"
    "  // where it goes. One line, and still no DOM access.\n"
    "  bw.sub('bw:message', function(m) { bw.patch('status', m.text); });\n"
    "</script></body></html>";

static int send_all(int fd, const char *data, size_t len) {
    size_t sent = 0;
    while (sent < len) {
        int n = (int)send(fd, data + sent, (int)(len - sent), 0);
        if (n <= 0) return 0;
        sent += (size_t)n;
    }
    return 1;
}

static int send_str(int fd, const std::string& s) { return send_all(fd, s.data(), s.size()); }

static void serve_bootstrap(int fd) {
    char head[160];
    std::snprintf(head, sizeof head,
        "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: %u\r\n"
        "Connection: close\r\n\r\n", (unsigned)(sizeof BOOTSTRAP - 1));
    send_all(fd, head, std::strlen(head));
    send_all(fd, BOOTSTRAP, sizeof BOOTSTRAP - 1);
}

/**
 * The one route that matters for "works offline": the bundle out of flash.
 *
 * Identical on an ESP32 -- same array, same headers, server.send_P() instead
 * of send(). The browser does the decompressing; the device never holds the
 * uncompressed bundle.
 */
static void serve_bundle(int fd) {
    char head[256];
    std::snprintf(head, sizeof head,
        "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n"
        "Content-Encoding: gzip\r\nContent-Length: %u\r\n"
        "Cache-Control: max-age=31536000, immutable\r\n"
        "Connection: close\r\n\r\n", bitwrench_js_gz_len);
    send_all(fd, head, std::strlen(head));
    send_all(fd, (const char *)bitwrench_js_gz, bitwrench_js_gz_len);
}

/** Open an SSE stream, mount the UI into it, and keep the socket. */
static void serve_events(int fd) {
    const char *head =
        "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n"
        "Cache-Control: no-cache\r\nConnection: keep-alive\r\n\r\n";
    if (!send_all(fd, head, std::strlen(head))) return;

    // First frame mounts the whole page. A browser that reconnects (or a
    // second browser) gets current state, not a blank screen -- the server is
    // the source of truth, so there is no hydration problem to solve.
    if (!send_str(fd, bwserve::sse_frame(bwserve::mount("#app", dashboard())))) return;

    if (!bw_clients_add(&g_clients, fd)) {
        BW_CLOSE(fd);
        return;
    }
    std::printf("[sse] client %d connected (%d total)\n", fd, g_clients.count);
}

/** Fan-out callback for bw_clients_each(): 0 means "this client is gone". */
static int push(int handle, const char *frame, void *user) {
    (void)user;
    return send_all(handle, frame, std::strlen(frame));
}

static void broadcast(const std::string& msg) {
    std::string frame = bwserve::sse_frame(msg);
    int before = g_clients.count;
    bw_clients_each(&g_clients, push, frame.c_str(), 0);
    if (g_clients.count != before)
        std::printf("[sse] dropped %d client(s) (%d left)\n", before - g_clients.count, g_clients.count);
}

/**
 * A button was clicked. The post-back is read without a JSON parser, then the
 * device decides what changed and patches exactly that.
 *
 * Note what is not here: no re-render of the page, no diff. The handler knows
 * which ids it touched, so it names them. That is the bitwrench update model,
 * and it is the reason a 2 KB send buffer is enough.
 */
static void handle_action(int fd, const char *body) {
    bw_action_t act;
    if (bw_parse_action(body, &act)) {
        std::printf("[action] %s\n", act.action);
        g_dev.clicks++;
        if (std::strcmp(act.action, "led_toggle") == 0) {
            g_dev.led = !g_dev.led;
            // Two things changed, so two patches -- not a re-mount. The alert's
            // colour changes with its text, which is what patch_attr is for.
            broadcast(bwserve::batch({
                bwserve::patch_attr("led", led_text(), "'class':'" + led_class() + "'"),
                bwserve::patch("led_btn", led_btn_text())
            }));
        } else if (std::strcmp(act.action, "reset") == 0) {
            g_dev.uptime = 0;
            broadcast(bwserve::patch("uptime", "0s"));

        } else if (std::strcmp(act.action, "set_label") == 0) {
            // The value the user typed. bw_action_field() reads it straight out
            // of the post-back -- no JSON parser on the device.
            char value[33];
            if (bw_action_field(&act, "value", value, sizeof value)) {
                std::snprintf(g_dev.label, sizeof g_dev.label, "%s", value);
                // bw::escape() is not optional here. The text came from a
                // keyboard, and a single quote in it would otherwise end the
                // string early and make the whole frame unparseable. Escaping
                // on the way out is the device's job; escaping on the way in
                // to the DOM is bitwrench's (content is escaped by default,
                // so a typed "<script>" renders as text).
                broadcast(bwserve::patch("title", bw::escape(title_text().c_str()).c_str()));
            }

        } else if (std::strcmp(act.action, "set_rate") == 0) {
            char value[8];
            if (bw_action_field(&act, "value", value, sizeof value)) {
                int r = std::atoi(value);
                if (r >= 1 && r <= 60) {
                    g_dev.rate = r;
                    char note[48];
                    std::snprintf(note, sizeof note, "pushing every %ds", r);
                    std::printf("[rate] %s\n", note);
                    broadcast(bwserve::message("info", note));
                }
            }
        }
        char n[16];
        std::snprintf(n, sizeof n, "%ld", g_dev.clicks);
        broadcast(bwserve::patch("clicks", n));
    }
    const char *ok = "HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n";
    send_all(fd, ok, std::strlen(ok));
}

static void serve_404(int fd) {
    const char *r = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
    send_all(fd, r, std::strlen(r));
}

/** @returns 1 when the socket was handed to the SSE registry (do not close). */
static int handle_request(int fd) {
    char req[4096];
    int n = (int)recv(fd, req, sizeof req - 1, 0);
    if (n <= 0) return 0;
    req[n] = '\0';

    const char *body = std::strstr(req, "\r\n\r\n");
    body = body ? body + 4 : "";

    if (std::strncmp(req, "GET /bitwrench.js", 17) == 0)      serve_bundle(fd);
    else if (std::strncmp(req, "GET /bw/events", 14) == 0)   { serve_events(fd); return 1; }
    else if (std::strncmp(req, "POST /bw/events", 15) == 0)    handle_action(fd, body);
    else if (std::strncmp(req, "GET / ", 6) == 0)              serve_bootstrap(fd);
    else                                                       serve_404(fd);
    return 0;
}

/** Once a second: advance the simulated sensors and patch what changed. */
static void tick() {
    g_dev.uptime += g_dev.rate;   /* seconds, not ticks: the rate is chosen in the browser */
    g_dev.temperature += ((std::rand() % 21) - 10) / 50.0;
    if (g_dev.temperature < 18) g_dev.temperature = 18;
    if (g_dev.temperature > 30) g_dev.temperature = 30;
    g_dev.humidity = 50 + (std::rand() % 11);

    if (!g_clients.count) return;

    char temp[16], hum[16], up[16];
    std::snprintf(temp, sizeof temp, "%.1f C", g_dev.temperature);
    std::snprintf(hum, sizeof hum, "%d %%", g_dev.humidity);
    std::snprintf(up, sizeof up, "%lds", g_dev.uptime);

    // One batch, one write, one reflow -- not three round trips.
    broadcast(bwserve::batch({
        bwserve::patch("temp", temp),
        bwserve::patch("humidity", hum),
        bwserve::patch("uptime", up)
    }));
}

int main(int argc, char **argv) {
    int port = argc > 1 ? std::atoi(argv[1]) : PORT;

    // Line-buffered: piping this into a log or a test harness should show
    // connections and clicks as they happen, not when the buffer fills.
    std::setvbuf(stdout, 0, _IOLBF, 0);

#ifdef _WIN32
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
#else
    std::signal(SIGPIPE, SIG_IGN);   // a browser tab closing must not kill us
#endif
    std::signal(SIGINT, on_signal);
    std::signal(SIGTERM, on_signal);

    bw_clients_init(&g_clients);
    std::srand((unsigned)std::time(0));

    int srv = (int)socket(AF_INET, SOCK_STREAM, 0);
    int yes = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, (const char *)&yes, sizeof yes);

    struct sockaddr_in addr;
    std::memset(&addr, 0, sizeof addr);
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons((unsigned short)port);

    if (bind(srv, (struct sockaddr *)&addr, sizeof addr) < 0) {
        std::fprintf(stderr, "bind: port %d in use\n", port);
        return 1;
    }
    listen(srv, 8);

    std::printf("bitwrench %s -- C++ demo on http://localhost:%d\n",
                BITWRENCH_EMBEDDED_VERSION, port);
    std::printf("serving /bitwrench.js from flash (%u bytes gzipped)\n", bitwrench_js_gz_len);
    std::fflush(stdout);

    // One thread, select() with a one-second timeout: accept when a browser
    // knocks, tick when it does not. An ESP32 does the same thing with
    // server.handleClient() in loop() plus a millis() check.
    time_t last = std::time(0);
    while (g_running) {
        fd_set rd;
        FD_ZERO(&rd);
        FD_SET(srv, &rd);
        struct timeval tv = { 1, 0 };
        if (select(srv + 1, &rd, 0, 0, &tv) > 0 && FD_ISSET(srv, &rd)) {
            int fd = (int)accept(srv, 0, 0);
            if (fd >= 0 && !handle_request(fd)) BW_CLOSE(fd);
        }
        time_t now = std::time(0);
        if (now - last >= g_dev.rate) { last = now; tick(); }
    }

    std::printf("\nshutting down\n");
    for (int i = 0; i < BW_MAX_CLIENTS; i++)
        if (g_clients.handles[i] >= 0) BW_CLOSE(g_clients.handles[i]);
    BW_CLOSE(srv);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
