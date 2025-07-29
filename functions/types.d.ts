interface PagesFunction<Env = unknown> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: RequestInit | Request) => Promise<Response>;
    data: Record<string, unknown>;
  }): Response | Promise<Response>;
}
