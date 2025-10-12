module.exports = {
  apps: [
    {
      name: 'Social-Alpha-BE',
      script: 'dist/main.js',
      cwd: '/home/mod/Documents/Projects/social-alpha-be',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
    },
  ],
};
