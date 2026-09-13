import https from "https";
import express, { Router } from "express";
import { WebSocket, WebSocketServer } from "ws";
import cookieParser from "cookie-parser";
import { IncomingMessage } from "http";
import cron from "node-cron";
import path from "path";
import { DateTime } from "luxon";

import { config } from "../../../app.config.js";
import { log } from "./instances.js";
import getEnv from "../../_common/helpers/getEnv.js";
import terminateApp from "../../_common/helpers/terminateApp.js";
import createViteServer from "../_common/helpers/createViteServer.js";
import { corsMiddleware } from "../_common/middlewares/cors.middleware.js";
import { maintenanceMiddleware } from "../_common/middlewares/maintenance.middleware.js";
import appRoute from "./routes/app.route.js";
import commonRoutes from "../_common/routes/common.routes.js";
import rateLimitMiddleware from "../_common/middlewares/rateLimit.middleware.js";
import websocketRoute from "./routes/websocket.route.js";
import { wc } from "../_common/instances.js";
import { checkIdleTimer } from "../_common/helpers/presence.js";

/* 
————————————————————————————————————————————————————————————————
Create servers 
———————————————————————————————————————————————————————————————— 
*/

const app = express();
app.set("trust proxy", 1);
app.set("json spaces", 2);
const router = Router();

const vitePort = config.ports.ws.main
export const vite = await createViteServer({
    isProduction: config.isProduction,
    host: config.domains.main,
    port: vitePort,
    ssl: getEnv("SSL") as object,
    root: "src/frontend",
});

/* 
————————————————————————————————————————————————————————————————
Middlewares
———————————————————————————————————————————————————————————————— 
*/

app.use(express.json());
app.use(cookieParser());
if (vite) app.use(vite.middlewares);
app.use(corsMiddleware);
app.use(maintenanceMiddleware);
app.use(rateLimitMiddleware(240));

/* 
————————————————————————————————————————————————————————————————
Routes
———————————————————————————————————————————————————————————————— 
*/

if (!vite) app.use(express.static(path.join(config.folders.root, "src", "frontend")));

app.use("/", router);

router.use("/", commonRoutes);
router.use("/websocket", websocketRoute);
router.use("/", appRoute);

/* 
————————————————————————————————————————————————————————————————
Start server
———————————————————————————————————————————————————————————————— 
*/

const server = https.createServer(getEnv("SSL") as object, app);
const port = config.ports.main

server.listen(port, "0.0.0.0", () => {
    log.server.info(`Server online at https://localhost:${port}`);
    if (vite) log.server.info(`Vite online at wss://localhost:${vitePort}`);
});

process.once("SIGTERM", () => terminateApp(log));
process.once("SIGINT", () => terminateApp(log));

/* 
————————————————————————————————————————————————————————————————
Websocket
———————————————————————————————————————————————————————————————— 
*/

interface ConnectedClient {
    ws: WebSocket;
    sessionId: string;
    userId: string;
}

export const connectedClients = new Map<string, ConnectedClient>();

export const isUserIdle = new Map<string, boolean>();
export const idleTimers = new Map<string, NodeJS.Timeout>();

const wss = new WebSocketServer({ server });

wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const rawCookies = req.headers.cookie || "";

    const cookies = Object.fromEntries(
        rawCookies.split("; ").filter(Boolean).map((cookie) => {
            const [key, ...val] = cookie.split("=");
            return [key.trim(), decodeURIComponent(val.join("="))];
        })
    );

    const sessionId = cookies.sessionId;

    if (!sessionId) return;

    const response: { userId: string } = await wc.callAPI(
        `https://${config.domains.auth}/connect/${sessionId}`,
        { auth: `ApiSecret ${getEnv("API_SECRET")}` }
    );

    ws.sessionId = sessionId;
    ws.userId = response.userId;

    const presenceResponse: { ok: boolean } = await wc.callAPI(
        `https://${config.domains.api}/v3/presence/online/${response.userId}`,
        { auth: `ApiSecret ${getEnv("API_SECRET")}` }
    );

    if (presenceResponse.ok) {
        ws.send(JSON.stringify({ 
            presence: {
                id: ws.userId,
                presence: "online"
            }
        }));
    }

    log.ws.info("Client connected:", ws.sessionId);

    connectedClients.set(sessionId, {
        ws,
        sessionId: sessionId,
        userId: response.userId
    });

   ws.on("message", (message: WebSocket.RawData) => {
        let data;

        try {
            data = JSON.parse(message.toString());
        } catch {
            log.ws.error("Invalid JSON").save();
            return;
        }

        log.ws.info(`Received from ${ws.sessionId}:`, data);

        if (data.status === "ready") {
            ws.send(JSON.stringify({ message: "connected" }));
        }

        if (data.active) {
            checkIdleTimer(sessionId, ws.userId);
        }
    });

    ws.on("close", async () => {
        await wc.callAPI(
            `https://${config.domains.auth}/disconnect/${ws.sessionId}`,
            { auth: `ApiSecret ${getEnv("API_SECRET")}` }
        );

        await wc.callAPI(
            `https://${config.domains.api}/v3/presence/offline/${ws.userId}`,
            { auth: `ApiSecret ${getEnv("API_SECRET")}` }
        );

        ws.send(JSON.stringify({ 
            presence: {
                id: ws.userId,
                presence: "offline",
                lastActive: DateTime.now().toUTC().toISO()
            }
        }));
        
        connectedClients.delete(ws.sessionId);

        log.ws.info("Client disconnected:", ws.sessionId);
    });

    ws.on("error", () => {
        log.ws.error("Client crashed:", ws.sessionId).save();
        connectedClients.delete(sessionId);
    });
});

/* 
————————————————————————————————————————————————————————————————
Scheduled events
———————————————————————————————————————————————————————————————— 
*/

// Run everyday at midnight
cron.schedule("0 0 * * *", () => {
    log.cron.info("Running daily tasks...");
    
    log.cleanLogs();
});
