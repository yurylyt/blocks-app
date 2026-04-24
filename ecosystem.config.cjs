const { readFileSync } = require('fs')
const { join } = require('path')

const envVars = {}
try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
} catch {}

module.exports = {
  apps: [{
    name: 'blocks',
    script: '.output/server/index.mjs',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: envVars.PORT || 3001,
      HOST: envVars.HOST || '127.0.0.1',
      ...envVars
    },
    max_memory_restart: '256M'
  }]
}
