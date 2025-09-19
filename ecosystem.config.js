const config = {
  apps: [
    {
      name: 'quill-dev-server',
      script: 'npx tsx server/index.ts',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      watch: true,
      ignore_watch: [
        'node_modules',
        'dist',
        'uploads',
        '*.log'
      ],
      instances: 1,
      exec_mode: 'fork',
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};

export default config;