// PM2's daemon doesn't inherit the shell env, and Next's automatic .env
// loading isn't reliable under pm2 fork mode — without this, the app starts
// with DATABASE_URL undefined and pg silently falls back to peer-auth
// defaults (OS user, db named after it), failing every DB call.
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

/** @type {import('@types/pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "3real",
      script: "node_modules/.bin/next",
      args: "start -p 3020",
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
        ...process.env,
        NODE_ENV: "production",
        PORT: "3020",
      },
    },
  ],
};
