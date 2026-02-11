import { Router } from "express";
import { search } from "../controllers/searchController";
import { searchLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", searchLimiter, search);

export default router;
