module.exports = {
  apps: [{
    name: 'erkos-security-dashboard',
    script: 'server.js',
    cwd: '/opt/bitnami/projects/erkos-security-dashboard',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    
    // Advanced features
    exec_mode: 'fork',
    kill_timeout: 5000,
    listen_timeout: 8000,
    
    // Environment variables
    env_file: '.env',
    
    // Monitoring
    pmx: true,
    
    // Source map support
    source_map_support: true,
    
    // Node.js specific options
    node_args: '--max-old-space-size=1024'
  }],

  deploy: {
    production: {
      user: 'bitnami',
      host: 'your-lightsail-ip',
      ref: 'origin/main',
      repo: 'https://github.com/Erkos-sec/Sec_front_end.git',
      path: '/opt/bitnami/projects/erkos-security-dashboard',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
