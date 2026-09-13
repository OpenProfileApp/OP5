import https from "https";
import express, { Router } from "express";
import cookieParser from "cookie-parser";
import cron from "node-cron";

import { config } from "../../../app.config.js";
import { log } from "./instances.js";
import { db } from "./databases/db.js";
import getEnv from "../../_common/helpers/getEnv.js";
import terminateApp from "../../_common/helpers/terminateApp.js";
import { corsMiddleware } from "../_common/middlewares/cors.middleware.js";
import { maintenanceMiddleware } from "../_common/middlewares/maintenance.middleware.js";
import sessionRoute from "./routes/session.routes.js";
import loginRoutes from "./routes/login.routes.js";
import captchaRoute from "./routes/captcha.route.js";
import tokenRoute from "./routes/token.route.js";
// import mfaRoutes from "./routes/mfa.routes.js";
import { validateSessionMiddleware } from "./middlewares/validateSession.middleware.js";
import rateLimitMiddleware from "../_common/middlewares/rateLimit.middleware.js";
import healthRoute from "../_common/routes/health.route.js";
import switchRoutes from "./routes/switch.route.js";
import logoutRoute from "./routes/logout.route.js";
import connectRoute from "./routes/connection/connect.route.js";
import disconnectRoute from "./routes/connection/disconnect.route.js";

/* 
————————————————————————————————————————————————————————————————
Create server 
———————————————————————————————————————————————————————————————— 
*/

const app = express();
app.set("trust proxy", 1);
app.set("json spaces", 2);
const router = Router();

/* 
————————————————————————————————————————————————————————————————
Middlewares
———————————————————————————————————————————————————————————————— 
*/

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use(maintenanceMiddleware);

/* 
————————————————————————————————————————————————————————————————
Routes
———————————————————————————————————————————————————————————————— 
*/
router.use("/health", healthRoute);

app.use("/", router); // Do not attach middlewares on this

router.use("/captcha", validateSessionMiddleware, rateLimitMiddleware(60), captchaRoute);
router.use("/token", validateSessionMiddleware, rateLimitMiddleware(120), tokenRoute);
router.use("/session", rateLimitMiddleware(240), sessionRoute); // No validateSessionMiddleware here
router.use("/switch", validateSessionMiddleware, rateLimitMiddleware(10), switchRoutes);
router.use("/login", validateSessionMiddleware, rateLimitMiddleware(10), loginRoutes);
router.use("/logout", validateSessionMiddleware, rateLimitMiddleware(10), logoutRoute);
router.use("/connect", rateLimitMiddleware(120), connectRoute);
router.use("/disconnect", rateLimitMiddleware(120), disconnectRoute);
// router.use("/mfa", validateSessionMiddleware, rateLimitMiddleware(20), mfaRoutes);

/* 
————————————————————————————————————————————————————————————————
Start server
———————————————————————————————————————————————————————————————— 
*/

const server = https.createServer(getEnv("SSL") as object, app);
const port = config.ports.auth

server.listen(port, "0.0.0.0", () => {
    log.server.info(`Server online at https://localhost:${port}`);
});

process.once("SIGTERM", () => terminateApp(log, db));
process.once("SIGINT", () => terminateApp(log, db));

/* 
————————————————————————————————————————————————————————————————
Scheduled events
———————————————————————————————————————————————————————————————— 
*/

// Run everyday at midnight
cron.schedule("0 0 * * *", () => {
    log.cron.info("Running daily tasks...");

    log.cleanLogs();

    const sessionsResult = db.accounts.query(
        `DELETE FROM sessions WHERE isTerminated = 1`,
    );

    if (!sessionsResult.success) {
        log.db.error(sessionsResult.error).save();
    }

    // DEVELOPER NEEDED: On premium expire, remove badges, and edit permissions
});
