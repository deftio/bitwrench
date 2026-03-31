/**
 * bwserve_demo — POSIX socket server speaking the bwserve protocol.
 *
 * This is a desktop simulation of what an ESP32 would do. It runs on
 * Linux/macOS without any hardware — just compile and run:
 *
 *   mkdir build && cd build
 *   cmake .. && make
 *   ./bwserve_demo
 *
 * Then open http://localhost:8080 in your browser.
 *
 * The server:
 *   - Serves a bitwrench bootstrap HTML page on GET /
 *   - Pushes sensor data via SSE on GET /events
 *   - Accepts commands via POST /api/command
 *   - Uses bitwrench.h + bwserve.h macros for all protocol messages
 *
 * This demonstrates the exact same wire protocol that would run on an
 * ESP32. The only difference is the transport layer (POSIX sockets vs
 * ESPAsyncWebServer). Copy the protocol logic to your embedded project.
 *
 * License: BSD-2-Clause
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <math.h>
#include <pthread.h>
#include <signal.h>
#include <errno.h>

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#include "bitwrench.h"
#include "bwserve.h"

/* ========================================================================
 * Configuration
 * ======================================================================== */

#define PORT            8080
#define MAX_CLIENTS     8
#define SENSOR_INTERVAL 2   /* seconds between SSE pushes */
#define BACKLOG         16
#define REQ_BUF_SIZE    4096

/* ========================================================================
 * Simulated sensor state
 * ======================================================================== */

typedef struct {
    float temperature;
    float humidity;
    float pressure;
    int   light;
    int   led_on;
    unsigned long uptime_s;
} sensor_state_t;

static sensor_state_t g_sensors = {
    .temperature = 22.0f,
    .humidity = 55.0f,
    .pressure = 1013.25f,
    .light = 512,
    .led_on = 0,
    .uptime_s = 0
};

static volatile int g_running = 1;

/* ========================================================================
 * SSE client tracking
 * ======================================================================== */

static int g_sse_clients[MAX_CLIENTS];
static int g_sse_count = 0;
static pthread_mutex_t g_sse_lock = PTHREAD_MUTEX_INITIALIZER;

static void sse_add_client(int fd) {
    pthread_mutex_lock(&g_sse_lock);
    if (g_sse_count < MAX_CLIENTS) {
        g_sse_clients[g_sse_count++] = fd;
        printf("[sse] client connected (fd=%d, total=%d)\n", fd, g_sse_count);
    } else {
        printf("[sse] max clients reached, rejecting fd=%d\n", fd);
        close(fd);
    }
    pthread_mutex_unlock(&g_sse_lock);
}

static void sse_remove_client(int fd) {
    pthread_mutex_lock(&g_sse_lock);
    for (int i = 0; i < g_sse_count; i++) {
        if (g_sse_clients[i] == fd) {
            g_sse_clients[i] = g_sse_clients[--g_sse_count];
            break;
        }
    }
    pthread_mutex_unlock(&g_sse_lock);
    close(fd);
}

static void sse_broadcast(const char* data) {
    char frame[BW_BUF_SIZE * 2];
    BW_SSE_FRAME(frame, data);
    size_t frame_len = strlen(frame);

    pthread_mutex_lock(&g_sse_lock);
    for (int i = 0; i < g_sse_count; ) {
        ssize_t written = write(g_sse_clients[i], frame, frame_len);
        if (written <= 0) {
            /* Client disconnected */
            printf("[sse] client disconnected (fd=%d)\n", g_sse_clients[i]);
            close(g_sse_clients[i]);
            g_sse_clients[i] = g_sse_clients[--g_sse_count];
        } else {
            i++;
        }
    }
    pthread_mutex_unlock(&g_sse_lock);
}

/* ========================================================================
 * Simulated sensor updates
 * ======================================================================== */

static void update_sensors(void) {
    /* Simulate slowly drifting sensor values */
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
 * Build and broadcast sensor UI updates using bwserve protocol
 * ======================================================================== */

static void broadcast_sensor_update(void) {
    /* Use batch to send all updates atomically */
    bw_batch_t batch;
    bw_batch_begin(&batch);

    char temp_msg[BW_BUF_SIZE];
    char temp_str[32];
    snprintf(temp_str, sizeof(temp_str), "%.1f C", g_sensors.temperature);
    BW_PATCH(temp_msg, "val-temp", temp_str);
    bw_batch_add(&batch, temp_msg);

    char hum_msg[BW_BUF_SIZE];
    char hum_str[32];
    snprintf(hum_str, sizeof(hum_str), "%.1f%%", g_sensors.humidity);
    BW_PATCH(hum_msg, "val-humidity", hum_str);
    bw_batch_add(&batch, hum_msg);

    char pres_msg[BW_BUF_SIZE];
    char pres_str[32];
    snprintf(pres_str, sizeof(pres_str), "%.1f hPa", g_sensors.pressure);
    BW_PATCH(pres_msg, "val-pressure", pres_str);
    bw_batch_add(&batch, pres_msg);

    char light_msg[BW_BUF_SIZE];
    char light_str[32];
    snprintf(light_str, sizeof(light_str), "%d lux", g_sensors.light);
    BW_PATCH(light_msg, "val-light", light_str);
    bw_batch_add(&batch, light_msg);

    char up_msg[BW_BUF_SIZE];
    char up_str[32];
    snprintf(up_str, sizeof(up_str), "%lus", g_sensors.uptime_s);
    BW_PATCH(up_msg, "val-uptime", up_str);
    bw_batch_add(&batch, up_msg);

    char led_msg[BW_BUF_SIZE];
    BW_PATCH(led_msg, "val-led", g_sensors.led_on ? "ON" : "OFF");
    bw_batch_add(&batch, led_msg);

    char out[BW_BUF_SIZE * 4];
    bw_batch_end(out, sizeof(out), &batch);

    sse_broadcast(out);
}

/* ========================================================================
 * Bootstrap HTML — the page served on GET /
 *
 * In a real ESP32, this would come from SPIFFS. Here we build it inline
 * using standard C string concatenation.
 * ======================================================================== */

static const char BOOTSTRAP_HTML[] =
    "<!DOCTYPE html>"
    "<html><head>"
    "<meta charset=\"UTF-8\">"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
    "<title>bwserve C Demo</title>"
    "<style>"
    "body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:1rem}"
    ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.75rem;max-width:700px;margin:1rem auto}"
    ".card{background:#1e293b;border-radius:8px;padding:1rem;text-align:center}"
    ".card h3{margin:0 0 0.5rem;font-size:0.85rem;color:#94a3b8;text-transform:uppercase}"
    ".card .val{font-size:1.5rem;font-weight:700;color:#38bdf8}"
    "h1{text-align:center;color:#10b981;font-size:1.5rem}"
    ".controls{text-align:center;margin:1rem}"
    "button{background:#334155;color:#e2e8f0;border:1px solid #475569;border-radius:6px;"
    "padding:0.5rem 1.5rem;cursor:pointer;font-size:0.9rem;margin:0 0.25rem}"
    "button:hover{background:#475569}"
    "</style>"
    "</head><body>"
    "<h1>bwserve C Demo</h1>"
    "<p style=\"text-align:center;color:#64748b\">POSIX socket server speaking bwserve protocol</p>"
    "<div class=\"grid\">"
    "<div class=\"card\"><h3>Temperature</h3><div class=\"val\" id=\"val-temp\">--</div></div>"
    "<div class=\"card\"><h3>Humidity</h3><div class=\"val\" id=\"val-humidity\">--</div></div>"
    "<div class=\"card\"><h3>Pressure</h3><div class=\"val\" id=\"val-pressure\">--</div></div>"
    "<div class=\"card\"><h3>Light</h3><div class=\"val\" id=\"val-light\">--</div></div>"
    "<div class=\"card\"><h3>Uptime</h3><div class=\"val\" id=\"val-uptime\">--</div></div>"
    "<div class=\"card\"><h3>LED</h3><div class=\"val\" id=\"val-led\">OFF</div></div>"
    "</div>"
    "<div class=\"controls\">"
    "<button onclick=\"sendCmd('led_on')\">LED On</button>"
    "<button onclick=\"sendCmd('led_off')\">LED Off</button>"
    "<button onclick=\"sendCmd('reset_uptime')\">Reset Uptime</button>"
    "</div>"
    "<script>"
    "var es=new EventSource('/events');"
    "es.onmessage=function(e){"
    "  var msg;"
    "  var raw=e.data;"
    "  if(raw.charAt(0)==='r'){"
    "    raw=raw.slice(1);"
    "    raw=raw.replace(/'/g,'\"');"  /* simple inline parser for demo */
    "  }"
    "  try{msg=JSON.parse(raw)}catch(x){return}"
    "  if(msg.type==='batch'){"
    "    msg.ops.forEach(function(op){applyOp(op)});"
    "  }else{applyOp(msg)}"
    "};"
    "function applyOp(op){"
    "  if(op.type==='patch'){"
    "    var el=document.getElementById(op.target);"
    "    if(el)el.textContent=op.content;"
    "  }else if(op.type==='replace'){"
    "    var el2=document.querySelector(op.target);"
    "    if(el2)el2.innerHTML=op.node;"
    "  }"
    "}"
    "function sendCmd(cmd){"
    "  fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},"
    "    body:JSON.stringify({cmd:cmd})});"
    "}"
    "</script>"
    "</body></html>";

/* ========================================================================
 * HTTP request routing
 * ======================================================================== */

/**
 * Minimal HTTP request parser — extracts method and path.
 */
static int parse_request(const char* buf, char* method, size_t mlen,
                         char* path, size_t plen, const char** body) {
    /* Method */
    const char* sp1 = strchr(buf, ' ');
    if (!sp1) return -1;
    size_t ml = (size_t)(sp1 - buf);
    if (ml >= mlen) ml = mlen - 1;
    memcpy(method, buf, ml);
    method[ml] = '\0';

    /* Path */
    const char* sp2 = strchr(sp1 + 1, ' ');
    if (!sp2) return -1;
    size_t pl = (size_t)(sp2 - sp1 - 1);
    if (pl >= plen) pl = plen - 1;
    memcpy(path, sp1 + 1, pl);
    path[pl] = '\0';

    /* Body: after \r\n\r\n */
    *body = strstr(buf, "\r\n\r\n");
    if (*body) *body += 4;

    return 0;
}

static void handle_request(int client_fd) {
    char buf[REQ_BUF_SIZE];
    ssize_t n = read(client_fd, buf, sizeof(buf) - 1);
    if (n <= 0) { close(client_fd); return; }
    buf[n] = '\0';

    char method[16], path[256];
    const char* body = NULL;
    if (parse_request(buf, method, sizeof(method), path, sizeof(path), &body) < 0) {
        close(client_fd);
        return;
    }

    printf("[http] %s %s\n", method, path);

    /* GET / — serve bootstrap HTML */
    if (strcmp(method, "GET") == 0 && strcmp(path, "/") == 0) {
        char resp[sizeof(BOOTSTRAP_HTML) + 256];
        snprintf(resp, sizeof(resp),
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/html; charset=UTF-8\r\n"
            "Content-Length: %d\r\n"
            "Connection: close\r\n"
            "\r\n"
            "%s",
            (int)strlen(BOOTSTRAP_HTML), BOOTSTRAP_HTML);
        write(client_fd, resp, strlen(resp));
        close(client_fd);
        return;
    }

    /* GET /events — SSE stream */
    if (strcmp(method, "GET") == 0 && strcmp(path, "/events") == 0) {
        const char* headers = BW_SSE_HEADERS;
        write(client_fd, headers, strlen(headers));
        sse_add_client(client_fd);

        /* Send initial state immediately */
        broadcast_sensor_update();
        return;  /* Don't close — kept alive for SSE */
    }

    /* POST /api/command — handle commands */
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/command") == 0) {
        int recognized = 0;
        if (body) {
            /* Simple command parsing for demo readability.
             * Production code should use a proper JSON parser and auth checks.
             */
            if (strstr(body, "led_on")) {
                g_sensors.led_on = 1;
                printf("[cmd] LED on\n");
                recognized = 1;
            } else if (strstr(body, "led_off")) {
                g_sensors.led_on = 0;
                printf("[cmd] LED off\n");
                recognized = 1;
            } else if (strstr(body, "reset_uptime")) {
                g_sensors.uptime_s = 0;
                printf("[cmd] Uptime reset\n");
                recognized = 1;
            }
            if (recognized) {
                /* Broadcast updated state immediately */
                broadcast_sensor_update();
            }
        }
        char resp[512];
        if (recognized) {
            BW_HTTP_OK_JSON(resp, "{\"ok\":true}");
        } else {
            BW_HTTP_OK_JSON(resp, "{\"ok\":false,\"error\":\"unknown cmd\"}");
        }
        write(client_fd, resp, strlen(resp));
        close(client_fd);
        return;
    }

    /* 404 */
    char resp[256];
    BW_HTTP_404(resp);
    write(client_fd, resp, strlen(resp));
    close(client_fd);
}

/* ========================================================================
 * SSE push thread — sends sensor updates every SENSOR_INTERVAL seconds
 * ======================================================================== */

static void* sensor_thread(void* arg) {
    (void)arg;
    while (g_running) {
        sleep(SENSOR_INTERVAL);
        update_sensors();
        broadcast_sensor_update();
    }
    return NULL;
}

/* ========================================================================
 * Signal handler — clean shutdown
 * ======================================================================== */

static void handle_signal(int sig) {
    (void)sig;
    printf("\n[server] shutting down...\n");
    g_running = 0;
}

/* ========================================================================
 * Main
 * ======================================================================== */

int main(void) {
    srand((unsigned)time(NULL));
    signal(SIGINT, handle_signal);
    signal(SIGPIPE, SIG_IGN);  /* Ignore broken pipe from SSE clients */

    /* Create server socket */
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return 1;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(server_fd);
        return 1;
    }

    if (listen(server_fd, BACKLOG) < 0) {
        perror("listen");
        close(server_fd);
        return 1;
    }

    printf("=== bwserve C demo ===\n");
    printf("Listening on http://localhost:%d\n", PORT);
    printf("Press Ctrl+C to stop\n\n");

    /* Start sensor update thread */
    pthread_t sensor_tid;
    pthread_create(&sensor_tid, NULL, sensor_thread, NULL);

    /* Accept loop */
    while (g_running) {
        struct sockaddr_in client_addr;
        socklen_t client_len = sizeof(client_addr);
        int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
        if (client_fd < 0) {
            if (errno == EINTR) continue;
            perror("accept");
            break;
        }
        handle_request(client_fd);
    }

    /* Cleanup */
    pthread_mutex_lock(&g_sse_lock);
    for (int i = 0; i < g_sse_count; i++) {
        close(g_sse_clients[i]);
    }
    pthread_mutex_unlock(&g_sse_lock);

    close(server_fd);
    pthread_join(sensor_tid, NULL);
    printf("[server] done.\n");
    return 0;
}
