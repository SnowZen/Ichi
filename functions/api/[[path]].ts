import { createServer } from "../../server";

export interface Env {
  // Add environment variables here if needed
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const app = createServer();

  // Convert Cloudflare Pages request to Express-compatible request
  const { request, env } = context;
  const url = new URL(request.url);

  // Extract the API path from the URL
  const apiPath = url.pathname.replace("/api", "") || "/";

  // Create a mock Express request/response
  const mockReq = {
    method: request.method,
    url: apiPath,
    headers: Object.fromEntries(request.headers.entries()),
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
    query: Object.fromEntries(url.searchParams.entries()),
    params: {},
  };

  // Create a response object
  let statusCode = 200;
  let responseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  let responseBody = "";

  const mockRes = {
    status: (code: number) => {
      statusCode = code;
      return mockRes;
    },
    json: (data: any) => {
      responseBody = JSON.stringify(data);
      return mockRes;
    },
    send: (data: any) => {
      responseBody = typeof data === "string" ? data : JSON.stringify(data);
      return mockRes;
    },
    header: (name: string, value: string) => {
      responseHeaders[name] = value;
      return mockRes;
    },
    setHeader: (name: string, value: string) => {
      responseHeaders[name] = value;
      return mockRes;
    },
    end: (data?: any) => {
      if (data) {
        responseBody = typeof data === "string" ? data : JSON.stringify(data);
      }
      return mockRes;
    },
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: responseHeaders,
    });
  }

  try {
    // Find the matching route in Express app
    const router = (app as any)._router;
    if (router) {
      // Simple route matching for our API endpoints
      const method = request.method.toLowerCase();
      const path = apiPath;

      // Parse request body for POST/PUT requests
      if (
        mockReq.body &&
        typeof mockReq.body === "string" &&
        mockReq.body.trim()
      ) {
        try {
          (mockReq as any).body = JSON.parse(mockReq.body);
        } catch (e) {
          // Keep as string if not JSON
        }
      }

      // Set up route parameters
      if (path.includes("/rooms/")) {
        const parts = path.split("/");
        const roomIndex = parts.findIndex((p) => p === "rooms");
        if (roomIndex >= 0 && parts[roomIndex + 1]) {
          (mockReq as any).params.roomId = parts[roomIndex + 1];
        }
      }

      // Import and use the server routes directly
      const { default: roomsRouter } = await import(
        "../../server/routes/rooms"
      );

      // Handle the request based on the path
      if (path.startsWith("/rooms")) {
        // Simulate Express routing
        await new Promise<void>((resolve, reject) => {
          const next = (err?: any) => {
            if (err) reject(err);
            else resolve();
          };

          // Mock Express app behavior
          (mockReq as any).app = app;
          roomsRouter(mockReq as any, mockRes as any, next);
        });
      } else {
        // Default response for unknown routes
        mockRes.status(404).json({ error: "Route not found" });
      }
    } else {
      mockRes.status(404).json({ error: "Router not found" });
    }
  } catch (error) {
    console.error("API Error:", error);
    mockRes.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return new Response(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
};
