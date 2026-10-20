module.exports = {
  apps: [
    {
      name: 'chat-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: { PORT: 3000, NODE_ENV: 'production' }
    },
    {
      name: 'chat-server',
      cwd: './apps/server',
      script: 'dist/index.js',
      env: { PORT: 3001, NODE_ENV: 'production' }
    }
  ]
};
