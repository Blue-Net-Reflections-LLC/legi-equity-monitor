/** @type {import('next').NextConfig} */
const nextConfig = {
    // (Optional) Export as a static site
    // See https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#configuration
    // output: 'export', // Feel free to modify/remove this option

    // Override the default webpack configuration
    webpack: (config) => {
        // Ignore node-specific modules when bundling for the browser
        // See https://webpack.js.org/configuration/resolve/#resolvealias
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
        }
        return config;
    },

    // Environment variables that should be available in the browser
    // These must match the environment variables in .env.local
    env: {
        NEXT_PUBLIC_CLIENT_MODEL_NAME: process.env.NEXT_PUBLIC_CLIENT_MODEL_NAME,
    },

    // Configure image domains if using next/image
    images: {
        unoptimized: true, // Required for static export
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'static.votesmart.org',
                pathname: '/canphoto/**',
                pathname: '/static/canphoto/**',
            },
        ],
    },
};

export default nextConfig;