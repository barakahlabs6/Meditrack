module.exports = {
  apps: [
    {
      name: 'meditrack-api',
      cwd: '/home/alexis/portfolio-app/apps/api',
      script: '/home/alexis/.nvm/versions/node/v22.20.0/bin/node',
      args: '/home/alexis/.nvm/versions/node/v22.20.0/bin/tsx watch src/index.ts',
      watch: false,
    },
    {
      name: 'meditrack-tunnel',
      cwd: '/home/alexis/portfolio-app',
      script: '/usr/local/bin/cloudflared',
      args: 'tunnel --url http://localhost:4000',
      watch: false,
      autorestart: true,
      output: '/tmp/tunnel.log',
      error: '/tmp/tunnel.log',
    },
    {
      name: 'meditrack-tunnel-watcher',
      cwd: '/home/alexis/portfolio-app',
      script: '/bin/bash',
      args: './tunnel-watcher.sh',
      watch: false,
      autorestart: false,
    },
  ],
};
