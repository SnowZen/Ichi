import serverless from "serverless-http";
import { createServer } from "../../server";

export interface Env {
  // Add environment variables here if needed
}

// Create the serverless handler
const handler = serverless(createServer());

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Convert Cloudflare Request to Node.js compatible format
    const url = new URL(request.url);
    
    // Create a minimal event object compatible with serverless-http
    const event = {
      httpMethod: request.method,
      path: url.pathname.replace('/api', '') || '/',
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : null,
      isBase64Encoded: false,
    };

    // Create minimal context
    const lambdaContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'api',
      functionVersion: '1',
      invokedFunctionArn: '',
      memoryLimitInMB: 128,
      awsRequestId: 'cloudflare-' + Date.now(),
      logGroupName: '',
      logStreamName: '',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    };

    // Call the serverless handler
    const result = await new Promise((resolve, reject) => {
      handler(event, lambdaContext, (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      });
    });

    const response = result as any;

    // Convert response to Cloudflare Response
    return new Response(response.body, {
      status: response.statusCode || 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...response.headers,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
