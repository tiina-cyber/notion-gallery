/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // allow Notion to iframe your site
          { key: "Content-Security-Policy", value: "frame-ancestors https://www.notion.so https://notion.so https://*.notion.site;" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          // prevent search engines from indexing
          { key: "X-Robots-Tag", value: "noindex, nofollow" }
        ],
      },
    ];
  },
};
module.exports = nextConfig;
