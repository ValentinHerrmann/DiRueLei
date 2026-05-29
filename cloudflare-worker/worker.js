export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetUrlStr = url.searchParams.get("url") || url.search.substring(1);
    
    // Check if URL is provided
    if (!targetUrlStr) {
      return new Response("Missing url parameter. Usage: ?url=https://artemis.tum.de/api/...", { status: 400 });
    }
    
    // We want to allow the specific origin
    const origin = request.headers.get("Origin");
    
    // Handle CORS preflight (OPTIONS) requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
        }
      });
    }

    // Rewrite request to target
    try {
      const targetUrl = new URL(targetUrlStr);
      
      const newRequest = new Request(targetUrl, new Request(request, {
        headers: request.headers
      }));
      
      // Remove headers that might cause issues with Artemis (so we look like a normal client, not a proxy)
      newRequest.headers.delete("Origin");
      newRequest.headers.delete("Referer");

      // Fetch the actual data from Artemis
      const response = await fetch(newRequest);
      
      // Recreate response to add CORS headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("Access-Control-Allow-Origin", origin || "*");
      
      return newResponse;
    } catch (e) {
      return new Response("Error fetching target: " + e.message, { status: 500 });
    }
  }
}
