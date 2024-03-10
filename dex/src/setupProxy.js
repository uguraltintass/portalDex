const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {

app.use( "/swap",
createProxyMiddleware({
  target: "https://api.1inch.dev",
  changeOrigin: true,
  onProxyReq: (proxyReq) => {
    // add API key in Header
    proxyReq.setHeader(
      "Authorization",
      "Bearer pDZdUv4RjMQ5pOx8U9BHH8P5AgEoQ8nv"
      );
    },
  })
 );
};