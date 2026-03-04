module.exports = {
    apps: [
        {
            name: "nexgen-saas",
            script: "dist/server.js",

            // Use cluster mode if you want multi-core scaling
            exec_mode: "fork",
            instances: 1, // or set to 2, 4, etc.

            node_args: "--max-old-space-size=4096",

            env: {
                NODE_ENV: "development"
            },

            env_production: {
                NODE_ENV: "production"
            },

            watch: false, // NEVER use watch in production

            max_memory_restart: "4500M",

            error_file: "./logs/error.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            time: true
        }
    ],

    deploy: {
        production: {
            user: "root",
            host: "[IP_ADDRESS]",
            ref: "origin/main",
            repo: "https://github.com/dee-raj/NexGen-Society-SaaS.git",
            path: "/var/www/nexgen-saas",

            "post-deploy":
                "npm install && npm run build && pm2 reload ecosystem.config.js --env production"
        }
    }
};
