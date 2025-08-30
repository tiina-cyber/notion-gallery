/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // apply to all routes
        source: "/(.*)",
        headers: [
          // allow Notion to iframe your site
          { key: "Content-Security-Policy", value: "frame-ancestors https://www.notion.so https://notion.so https://*.notion.site;" },
          // make sure no default SAMEORIGIN blocks iframing
          { key: "X-Frame-Options", value: "ALLOWALL" }
        ],
      },
    ];
  },
};
module.exports = nextConfig;
