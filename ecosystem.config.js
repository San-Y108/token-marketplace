module.exports = {
  apps: [{
    name: 'token-marketplace-server',
    script: './server/dist/index.js',
    cwd: '/Users/yanshuo/token-marketplace',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
