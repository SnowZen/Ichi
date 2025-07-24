import { RequestHandler } from "express";

// This would typically import from the same storage as rooms
// For simplicity, we'll handle wild color in the main playCard endpoint
export const setWildColor: RequestHandler = (req, res) => {
  res.status(501).json({ error: 'Use playCard endpoint with wildColor parameter' });
};
