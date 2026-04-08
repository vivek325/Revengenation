module.exports = {
  apps: [
    {
      name: "revengenation",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./",
      instances: "max",        // EC2 ke sabhi CPU cores use karega
      exec_mode: "cluster",    // cluster mode for load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
