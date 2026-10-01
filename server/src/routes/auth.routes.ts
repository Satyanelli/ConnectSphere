
import { Router } from "express";

import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/refresh-token", refreshToken);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;

