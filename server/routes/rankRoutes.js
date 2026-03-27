import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  getRanks,
  createRank,
  updateRank,
  deleteRank,
  toggleRankStatus
} from "../controllers/rankController.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getRanks);
router.post("/", verifyToken, isAdmin, createRank);
router.put("/:id", verifyToken, isAdmin, updateRank);
router.delete("/:id", verifyToken, isAdmin, deleteRank);
router.put("/:id/toggle", verifyToken, isAdmin, toggleRankStatus);

export default router;