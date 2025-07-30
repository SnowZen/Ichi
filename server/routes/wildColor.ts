import { Context } from 'hono';
export const setWildColor = (c: Context) => {
  return c.json({ error: "Use playCard endpoint with wildColor parameter" }, 501);
};