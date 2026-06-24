module.exports = {
  apps: [
    {
      name: 'meditrack-api',
      script: '/home/alexis/portfolio-app/apps/api/start.sh',
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
  ],
};
