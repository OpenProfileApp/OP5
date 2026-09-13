import { config } from "../../../../app.config.js";
import getEnv from "../../../_common/helpers/getEnv.js";
import { connectedClients, idleTimers, isUserIdle } from "../../main/server.js";
import { wc } from "../instances.js";

function clearIdleTimer(sessionId: string) {
    if (idleTimers.has(sessionId)) {
        clearTimeout(idleTimers.get(sessionId));
        idleTimers.delete(sessionId);
    }
}

async function updatePresence(userId: string, status: "online" | "idle"): Promise<boolean> {
    const response: { ok: boolean } = await wc.callAPI(
        `https://${config.domains.api}/v3/presence/${status}/${userId}`,
        { auth: `ApiSecret ${getEnv("API_SECRET")}` }
    );

    return response.ok;
}

function sendPresenceToClient(sessionId: string, userId: string, status: "online" | "idle") {
    const client = connectedClients.get(sessionId);

    if (client && client.ws && client.ws.readyState === 1) {
        client.ws.send(
            JSON.stringify({
                presence: {
                    id: userId,
                    presence: status
                }
            })
        );
    }
}

export async function markUserIdle(sessionId: string, userId: string) {
    clearIdleTimer(sessionId);

    const isUpdated = await updatePresence(userId, "idle");

    if (isUpdated) {
        isUserIdle.set(userId, true);
        sendPresenceToClient(sessionId, userId, "idle");
    }
}

export async function checkIdleTimer(sessionId: string, userId: string) {
    clearIdleTimer(sessionId);

    if (isUserIdle.get(userId) === true) {
        const isUpdated = await updatePresence(userId, "online");

        if (isUpdated) {
            isUserIdle.set(userId, false);
            sendPresenceToClient(sessionId, userId, "online");
        }
    }

    const timer = setTimeout(() => {
        markUserIdle(sessionId, userId);
    }, (config.limits?.setIdlePresenceInMinutes || 1) * 60 * 1000);

    idleTimers.set(sessionId, timer);
}
