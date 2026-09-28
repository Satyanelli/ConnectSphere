import { Router } from "express";

import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getIncomingRequests,
  getConnections,
  getSentRequests,
  getRelationshipStatus,
  removeConnection,
} from "../controllers/connection.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/request",
  protect,
  sendConnectionRequest
);

router.patch(
  "/request/:connectionId/accept",
  protect,
  acceptConnectionRequest
);

router.patch(
  "/request/:connectionId/reject",
  protect,
  rejectConnectionRequest
);

router.get(
  "/requests",
  protect,
  getIncomingRequests
);

router.get(
  "/sent",
  protect,
  getSentRequests
);

router.get(
  "/status/:userId",
  protect,
  getRelationshipStatus
);

router.delete(
  "/:userId",
  protect,
  removeConnection
);


router.get(
  "/",
  protect,
  getConnections
);

export default router;