import { Request, Response } from "express";
import { searchService } from "../services/searchService";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError } from "../types/errors";

export const search = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query || query.trim().length < 2) {
    throw new ValidationError("Search query must be at least 2 characters");
  }

  const results = await searchService.search(query);

  res.status(200).json({
    success: true,
    data: results,
  });
});
