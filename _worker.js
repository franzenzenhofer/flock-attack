export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Simple static file serving
    try {
      // Try to serve the requested path
      const response = await env.ASSETS.fetch(request);
      
      // Add cache headers for better performance
      const headers = new Headers(response.headers);
      
      // Cache static assets
      if (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|webp|woff2?)$/)) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        headers.set('Cache-Control', 'public, max-age=3600');
      }
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (e) {
      // Return 404 for missing assets
      return new Response('Not Found', { status: 404 });
    }
  }
};