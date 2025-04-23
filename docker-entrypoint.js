#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'

const env = { ...process.env }

// Parse DATABASE_URL if present
if (process.env.DATABASE_URL) {
  try {
    const databaseUrl = new URL(process.env.DATABASE_URL)
    env.DB_HOST = databaseUrl.hostname
    env.DB_PORT = databaseUrl.port
    env.DB_USER = databaseUrl.username
    env.DB_PASSWORD = databaseUrl.password
    env.DB_DATABASE = databaseUrl.pathname.slice(1)
  } catch (err) {
    console.error('Invalid DATABASE_URL')
  }
}

// Set production defaults if not specified
env.NODE_ENV = env.NODE_ENV || 'production'
env.PORT = env.PORT || '3333'
env.HOST = env.HOST || '0.0.0.0'
env.LOG_LEVEL = env.LOG_LEVEL || 'info'
env.SESSION_DRIVER = env.SESSION_DRIVER || 'cookie'

// Ensure we're in the build directory
// try {
//   await fs.access('build')
//   process.chdir('build')
// } catch (error) {
//   console.error('Build directory not found. Make sure the application is built properly.')
//   process.exit(1)
// }

// // Install production dependencies
// await exec('npm ci --omit=dev')

// // Start the server
// await exec('node bin/server.js')

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}