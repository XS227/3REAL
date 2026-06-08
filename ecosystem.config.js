/** @type {import('@types/pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "3real",
      script: "node_modules/.bin/next",
      args: "start -p 3010",
      cwd: "/var/www/3real",

      // Single process — Next.js handles its own internal concurrency.
      // Switch to "cluster" + instances: "max" only after profiling.
      instances: 1,
      exec_mode: "fork",

      // Never watch the filesystem in production
      watch: false,

      // Restart policy
      restart_delay: 4000,      // ms to wait before restarting after a crash
      max_restarts: 10,         // after 10 consecutive crashes, stop trying
      min_uptime: "10s",        // must stay alive 10s to count as a successful start

      // Memory guardrail — Next.js can balloon under heavy SSR load
      max_memory_restart: "512M",

      // Logs — /var/log/pm2/ must exist and be writable
      error_file: "/var/log/pm2/3real-error.log",
      out_file: "/var/log/pm2/3real-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      env_production: {
        NODE_ENV: "production",
        PORT: "3010",
      },
    },
  ],
};
