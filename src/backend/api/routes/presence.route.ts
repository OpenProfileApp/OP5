import { Router } from "express";

import { updateUserPresence } from "../controllers/users/updateUserPresence.controller.js";

const presenceRoute = Router();

presenceRoute.get("/:type/:userId", updateUserPresence);

export default presenceRoute;
