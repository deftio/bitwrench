/**
 * bwserve_demo — the same app as ../posix-cpp, written in C99.
 *
 * A desktop program that serves a live bitwrench dashboard over POSIX
 * sockets. No microcontroller, no WiFi, no filesystem -- just cmake, a C
 * compiler and a browser. It is the ESP32 sketch with the transport swapped,
 * so the protocol logic here moves to firmware unchanged.
 *
 *   mkdir build && cd build
 *   cmake .. && make
 *   ./bwserve_demo
 *   # open http://localhost:8080
 *
 * Read ../posix-cpp/main.cpp alongside this: it is the C++ version, where
 * composing the UI is pleasanter (std::string, no fixed buffers). This file
 * is the one to copy if your toolchain is C only.
 *
 * Routes:
 *   GET  /bitwrench.js   the gzipped bundle out of flash (no CDN, no FS)
 *   GET  /               a bootstrap page with no markup and no DOM code
 *   GET  /events         SSE: mounts the UI, then patches it
 *   POST /bw/events      what bw.actions sends when a bw_act_* is clicked
 *
 * License: BSD-2-Clause
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <pthread.h>
#include <signal.h>
#include <errno.h>

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

/* Set before the headers: the registry and the send buffers size themselves
 * from these. A board with less RAM lowers them. */
#define BW_MAX_CLIENTS  8
#define BW_BUF_SIZE     1024

#include "bitwrench.h"
#include "bwserve.h"
#include "bitwrench_embedded.h"   /* generated: npm run build:generated */

#define PORT            8080
#define SENSOR_INTERVAL 2         /* seconds between SSE pushes */
#define BACKLOG         16
#define REQ_BUF_SIZE    4096

/* ========================================================================
 * Simulated sensor state (on a board: ADC reads and a GPIO level)
 * ======================================================================== */

typedef struct {
    float temperature;
    float humidity;
    float pressure;
    int   light;
    int   led_on;
    unsigned long uptime_s;
} sensor_state_t;

static sensor_state_t g_sensors = { 22.0f, 55.0f, 1013.25f, 512, 0, 0 };
static volatile int g_running = 1;

/* ========================================================================
 * Connected browsers
 *
 * bw_clients_t is the fixed-size registry from bwserve.h -- no allocation,
 * and a socket that has gone away is dropped during the fan-out. The mutex is
 * ours because this demo pushes from a second thread; a single-threaded
 * firmware loop does not need one.
 * ======================================================================== */

static bw_clients_t g_clients;
static pthread_mutex_t g_lock = PTHREAD_MUTEX_INITIALIZER;

static int push_frame(int handle, const char *frame, void *user) {
    size_t len = strlen(frame), sent = 0;
    (void)user;
    while (sent < len) {
        ssize_t n = write(handle, frame + sent, len - sent);
        if (n <= 0) return 0;          /* gone: bw_clients_each() drops it */
        sent += (size_t)n;
    }
    return 1;
}

static void broadcast(const char *msg) {
    char frame[BW_BUF_SIZE * 56];
    int before;
    BW_SSE_FRAME(frame, msg);
    pthread_mutex_lock(&g_lock);
    before = g_clients.count;
    bw_clients_each(&g_clients, push_frame, frame, NULL);
    if (g_clients.count != before)
        printf("[sse] dropped %d client(s), %d left\n", before - g_clients.count, g_clients.count);
    pthread_mutex_unlock(&g_lock);
}

/* ========================================================================
 * The UI, built in C as TACO strings
 *
 * BW_TACO_* makes a leaf (its content is quoted text). BW_NEST* holds other
 * nodes, which is how a whole screen goes out in one message.
 *
 * Two buffer rules, both enforced by the compiler if you build with
 * -Wall -Werror (and you should):
 *
 *   1. Each level needs its OWN buffer. Building a node into the buffer it is
 *      reading from is undefined behaviour.
 *   2. Each level must be LARGER than the level below it. Nesting grows the
 *      string, so a same-sized destination can silently truncate -- gcc says
 *      so via -Wformat-truncation, and it is right. Hence the escalating
 *      sizes below.
 *
 * The device is not sending HTML and not sending code -- it sends a component
 * description, and bitwrench renders it with the classes the page's
 * bw.loadStyles() call already styled.
 * ======================================================================== */

/* The LED alert's text and styling both follow one int, so both are derived
 * in one place -- the mount and the later patch cannot disagree. */
static const char *led_text(void) { return g_sensors.led_on ? "LED is ON" : "LED is off"; }
static const char *led_class(void) {
    return g_sensors.led_on ? "bw_bccl_alert bw_bccl_alert_success bw_mt_3"
                            : "bw_bccl_alert bw_bccl_alert_info bw_mt_3";
}
static const char *led_btn_text(void) { return g_sensors.led_on ? "LED off" : "LED on"; }

/** One labelled reading. `id` is the handle later patches address. */
static void stat_card(char *out, size_t out_size, const char *id,
                      const char *label, const char *value) {
    char lab[BW_TACO_BUF_SIZE], val[BW_TACO_BUF_SIZE];
    char kids[BW_BUF_SIZE];
    char card[BW_BUF_SIZE * 2];        /* nesting grows the string: see note below */
    BW_TACO_CLS(lab, "div", "bw_text_muted bw_text_sm", label);
    BW_TACO_ID(val, "div", id, value);
    BW_ARRAY_START(kids);
    BW_ARRAY_ITEM(kids, lab);
    BW_ARRAY_ITEM(kids, val);
    BW_ARRAY_END(kids);
    BW_NEST_CLS(card, "div", "bw_bccl_card bw_p_3", kids);
    snprintf(out, out_size, "r{'t':'div','a':{'class':'bw_col_6 bw_col_md_4'},'c':%s}",
             BW_SKIP_R(card));
}

static void format_readings(char *temp, char *hum, char *pres, char *light, char *up, size_t n) {
    snprintf(temp, n, "%.1f C", g_sensors.temperature);
    snprintf(hum, n, "%.1f %%", g_sensors.humidity);
    snprintf(pres, n, "%.1f hPa", g_sensors.pressure);
    snprintf(light, n, "%d lux", g_sensors.light);
    snprintf(up, n, "%lus", g_sensors.uptime_s);
}

/** The whole page. Sent once per connected browser. */
static void dashboard(char *out, size_t out_size) {
    char temp[32], hum[32], pres[32], light[32], up[32];
    char c1[BW_BUF_SIZE * 4], c2[BW_BUF_SIZE * 4], c3[BW_BUF_SIZE * 4];
    char c4[BW_BUF_SIZE * 4], c5[BW_BUF_SIZE * 4];
    char cards[BW_BUF_SIZE * 24], row[BW_BUF_SIZE * 32];
    char title[BW_TACO_BUF_SIZE], lead[BW_TACO_BUF_SIZE];
    char b1[BW_TACO_BUF_SIZE], b2[BW_TACO_BUF_SIZE];
    char btn_list[BW_BUF_SIZE], btns[BW_BUF_SIZE * 2], led[BW_BUF_SIZE];
    char body[BW_BUF_SIZE * 40];

    format_readings(temp, hum, pres, light, up, 32);
    stat_card(c1, sizeof c1, "val-temp", "Temperature", temp);
    stat_card(c2, sizeof c2, "val-humidity", "Humidity", hum);
    stat_card(c3, sizeof c3, "val-pressure", "Pressure", pres);
    stat_card(c4, sizeof c4, "val-light", "Light", light);
    stat_card(c5, sizeof c5, "val-uptime", "Uptime", up);

    BW_ARRAY_START(cards);
    BW_ARRAY_ITEM(cards, c1);
    BW_ARRAY_ITEM(cards, c2);
    BW_ARRAY_ITEM(cards, c3);
    BW_ARRAY_ITEM(cards, c4);
    BW_ARRAY_ITEM(cards, c5);
    BW_ARRAY_END(cards);
    BW_NEST_CLS(row, "div", "bw_row bw_g_3", cards);

    /* bw_act_* is the whole event wiring: bw.actions.enable() on the page
     * turns a click into a post-back carrying this name. No onclick, and no
     * code from the device. */
    BW_TACO_ATTR(b1, "button",
        "'class':'bw_bccl_btn bw_bccl_btn_primary bw_act_led_toggle','id':'led-btn'",
        led_btn_text());
    BW_TACO_ATTR(b2, "button",
        "'class':'bw_bccl_btn bw_bccl_btn_secondary bw_ml_2 bw_act_reset'", "Reset uptime");
    BW_ARRAY_START(btn_list);
    BW_ARRAY_ITEM(btn_list, b1);
    BW_ARRAY_ITEM(btn_list, b2);
    BW_ARRAY_END(btn_list);
    /* btn_list, not btns, as the source: writing a node into the buffer it is
     * reading from is undefined behaviour. */
    BW_NEST_CLS(btns, "div", "bw_mt_3", btn_list);

    {
        char led_attrs[128];
        snprintf(led_attrs, sizeof(led_attrs), "'class':'%s','id':'val-led'", led_class());
        BW_TACO_ATTR(led, "div", led_attrs, led_text());
    }

    BW_TACO_CLS(title, "h1", "bw_mb_1", "bwserve C demo");
    BW_TACO_CLS(lead, "p", "bw_text_muted",
        "POSIX sockets, C99, no framework. Served from flash.");

    BW_ARRAY_START(body);
    BW_ARRAY_ITEM(body, title);
    BW_ARRAY_ITEM(body, lead);
    BW_ARRAY_ITEM(body, row);
    BW_ARRAY_ITEM(body, btns);
    BW_ARRAY_ITEM(body, led);
    BW_ARRAY_END(body);

    snprintf(out, out_size,
        "r{'t':'div','a':{'class':'bw_bccl_container bw_py_4'},'c':%s}", body);
}

/* ========================================================================
 * Updates: name what changed
 *
 * No diffing, on either side. The code knows which ids it touched, so it says
 * so -- which is why one small buffer is enough for a page this size.
 * ======================================================================== */

static void broadcast_readings(void) {
    char temp[32], hum[32], pres[32], light[32], up[32];
    char msg[BW_BUF_SIZE], out[BW_BUF_SIZE * 4];
    bw_batch_t batch;

    format_readings(temp, hum, pres, light, up, 32);
    bw_batch_begin(&batch);
    BW_PATCH(msg, "val-temp", temp);        bw_batch_add(&batch, msg);
    BW_PATCH(msg, "val-humidity", hum);     bw_batch_add(&batch, msg);
    BW_PATCH(msg, "val-pressure", pres);    bw_batch_add(&batch, msg);
    BW_PATCH(msg, "val-light", light);      bw_batch_add(&batch, msg);
    BW_PATCH(msg, "val-uptime", up);        bw_batch_add(&batch, msg);
    bw_batch_end(out, sizeof(out), &batch);

    broadcast(out);                          /* one frame, one reflow */
}

static void update_sensors(void) {
    g_sensors.temperature += ((float)(rand() % 100) - 50) / 100.0f;
    if (g_sensors.temperature < 15.0f) g_sensors.temperature = 15.0f;
    if (g_sensors.temperature > 35.0f) g_sensors.temperature = 35.0f;

    g_sensors.humidity += ((float)(rand() % 100) - 50) / 50.0f;
    if (g_sensors.humidity < 20.0f) g_sensors.humidity = 20.0f;
    if (g_sensors.humidity > 90.0f) g_sensors.humidity = 90.0f;

    g_sensors.pressure += ((float)(rand() % 100) - 50) / 200.0f;
    g_sensors.light = 400 + (rand() % 300);
    g_sensors.uptime_s += SENSOR_INTERVAL;
}

/* ========================================================================
 * HTTP — the only part that changes per platform
 * ======================================================================== */

/**
 * The page. It has no UI in it: load bitwrench, enable actions, connect.
 * The C side owns the UI, so there is no markup, no CSS and no DOM code here.
 */
static const char BOOTSTRAP_HTML[] =
    "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
    "<title>bwserve C demo</title>"
    "<script src=\"/bitwrench.js\"></script></head>"
    "<body><div id=\"app\"></div><script>\n"
    "  bw.loadStyles({ primary: '#2b8a3e', mode: 'auto' });\n"
    "  bw.actions.enable();     // bw_act_* clicks post back to this server\n"
    "  bw.connect('/events');   // the server mounts and patches from here\n"
    "</script></body></html>";

static int parse_request(const char *buf, char *method, size_t mlen,
                         char *path, size_t plen, const char **body) {
    const char *sp1 = strchr(buf, ' ');
    const char *sp2;
    size_t ml, pl;
    if (!sp1) return -1;
    ml = (size_t)(sp1 - buf);
    if (ml >= mlen) ml = mlen - 1;
    memcpy(method, buf, ml);
    method[ml] = '\0';

    sp2 = strchr(sp1 + 1, ' ');
    if (!sp2) return -1;
    pl = (size_t)(sp2 - sp1 - 1);
    if (pl >= plen) pl = plen - 1;
    memcpy(path, sp1 + 1, pl);
    path[pl] = '\0';

    *body = strstr(buf, "\r\n\r\n");
    if (*body) *body += 4;
    return 0;
}

static void write_all(int fd, const char *data, size_t len) {
    size_t sent = 0;
    while (sent < len) {
        ssize_t n = write(fd, data + sent, len - sent);
        if (n <= 0) return;
        sent += (size_t)n;
    }
}

/**
 * The route that makes "works offline" true: the bundle out of flash.
 *
 * Identical on an ESP32 -- same array, same headers, server.send_P() instead
 * of write(). The browser decompresses; the device never holds the
 * uncompressed bundle.
 */
static void serve_bundle(int fd) {
    char head[256];
    snprintf(head, sizeof(head),
        "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n"
        "Content-Encoding: gzip\r\nContent-Length: %u\r\n"
        "Cache-Control: max-age=31536000, immutable\r\n"
        "Connection: close\r\n\r\n", bitwrench_js_gz_len);
    write_all(fd, head, strlen(head));
    write_all(fd, (const char *)bitwrench_js_gz, bitwrench_js_gz_len);
}

/** A click came back. Decide what changed, then patch exactly that. */
static void handle_action(int fd, const char *body) {
    char resp[256];
    bw_action_t act;

    if (body && bw_parse_action(body, &act)) {
        printf("[action] %s\n", act.action);
        if (strcmp(act.action, "led_toggle") == 0) {
            /* Two things changed, so two patches -- not a re-mount. The alert's
             * colour changes with its text, which is what BW_PATCH_ATTR is for. */
            char attrs[128], a[BW_BUF_SIZE], b[BW_BUF_SIZE], out[BW_BUF_SIZE * 3];
            bw_batch_t batch;
            g_sensors.led_on = !g_sensors.led_on;
            snprintf(attrs, sizeof(attrs), "'class':'%s'", led_class());
            BW_PATCH_ATTR(a, "val-led", led_text(), attrs);
            BW_PATCH(b, "led-btn", led_btn_text());
            bw_batch_begin(&batch);
            bw_batch_add(&batch, a);
            bw_batch_add(&batch, b);
            bw_batch_end(out, sizeof(out), &batch);
            broadcast(out);
        } else if (strcmp(act.action, "reset") == 0) {
            char msg[BW_BUF_SIZE];
            g_sensors.uptime_s = 0;
            BW_PATCH(msg, "val-uptime", "0s");
            broadcast(msg);
        }
    }
    BW_HTTP_OK_JSON(resp, "{\"ok\":true}");
    write_all(fd, resp, strlen(resp));
    close(fd);
}

static void handle_request(int fd) {
    char buf[REQ_BUF_SIZE];
    char method[16], path[256];
    const char *body = NULL;
    ssize_t n = read(fd, buf, sizeof(buf) - 1);

    if (n <= 0) { close(fd); return; }
    buf[n] = '\0';
    if (parse_request(buf, method, sizeof(method), path, sizeof(path), &body) < 0) {
        close(fd);
        return;
    }

    if (strcmp(method, "GET") == 0 && strcmp(path, "/bitwrench.js") == 0) {
        serve_bundle(fd);
        close(fd);
        return;
    }

    if (strcmp(method, "GET") == 0 && strcmp(path, "/") == 0) {
        char resp[sizeof(BOOTSTRAP_HTML) + 256];
        snprintf(resp, sizeof(resp),
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n"
            "Content-Length: %d\r\nConnection: close\r\n\r\n%s",
            (int)strlen(BOOTSTRAP_HTML), BOOTSTRAP_HTML);
        write_all(fd, resp, strlen(resp));
        close(fd);
        return;
    }

    /* SSE: open the stream, mount the whole UI into it, keep the socket.
     * A reconnecting or second browser gets current state, not a blank
     * screen -- the device is the source of truth, so there is no hydration
     * problem to solve. */
    if (strcmp(method, "GET") == 0 && strcmp(path, "/events") == 0) {
        const char *headers = BW_SSE_HEADERS;
        char page[BW_BUF_SIZE * 48], msg[BW_BUF_SIZE * 52], frame[BW_BUF_SIZE * 56];
        write_all(fd, headers, strlen(headers));

        dashboard(page, sizeof(page));
        BW_MOUNT(msg, "#app", page);
        BW_SSE_FRAME(frame, msg);
        write_all(fd, frame, strlen(frame));

        pthread_mutex_lock(&g_lock);
        if (!bw_clients_add(&g_clients, fd)) {
            pthread_mutex_unlock(&g_lock);
            printf("[sse] registry full, rejecting fd=%d\n", fd);
            close(fd);
            return;
        }
        printf("[sse] client connected (fd=%d, total=%d)\n", fd, g_clients.count);
        pthread_mutex_unlock(&g_lock);
        return;                        /* do not close: this is the stream */
    }

    if (strcmp(method, "POST") == 0 &&
        (strcmp(path, "/bw/events") == 0 || strcmp(path, "/events") == 0)) {
        handle_action(fd, body);
        return;
    }

    {
        char resp[256];
        BW_HTTP_404(resp);
        write_all(fd, resp, strlen(resp));
        close(fd);
    }
}

/* ========================================================================
 * Push thread and main
 * ======================================================================== */

static void *sensor_thread(void *arg) {
    (void)arg;
    while (g_running) {
        sleep(SENSOR_INTERVAL);
        update_sensors();
        if (g_clients.count) broadcast_readings();
    }
    return NULL;
}

static void handle_signal(int sig) {
    (void)sig;
    g_running = 0;
}

int main(void) {
    int server_fd, opt = 1, i;
    struct sockaddr_in addr;
    pthread_t sensor_tid;

    setvbuf(stdout, NULL, _IOLBF, 0);
    srand((unsigned)time(NULL));
    signal(SIGINT, handle_signal);
    signal(SIGPIPE, SIG_IGN);          /* a closing tab must not kill us */

    bw_clients_init(&g_clients);

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) { perror("socket"); return 1; }
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }
    if (listen(server_fd, BACKLOG) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    printf("=== bwserve C demo (bitwrench %s) ===\n", BITWRENCH_EMBEDDED_VERSION);
    printf("http://localhost:%d  --  serving /bitwrench.js from flash (%u bytes gzipped)\n",
           PORT, bitwrench_js_gz_len);
    printf("Press Ctrl+C to stop\n\n");

    pthread_create(&sensor_tid, NULL, sensor_thread, NULL);

    while (g_running) {
        int client_fd = accept(server_fd, NULL, NULL);
        if (client_fd < 0) {
            if (errno == EINTR) continue;
            perror("accept");
            break;
        }
        handle_request(client_fd);
    }

    printf("\n[server] shutting down...\n");
    pthread_mutex_lock(&g_lock);
    for (i = 0; i < BW_MAX_CLIENTS; i++)
        if (g_clients.handles[i] >= 0) close(g_clients.handles[i]);
    pthread_mutex_unlock(&g_lock);

    close(server_fd);
    pthread_join(sensor_tid, NULL);
    printf("[server] done.\n");
    return 0;
}
