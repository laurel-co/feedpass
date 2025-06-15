import { defineConfig } from 'vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'

function generateManifest() {
  const manifest = readJsonFile('src/manifest.json')
  const pkg = readJsonFile('package.json')
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  }
}

export default defineConfig({
  plugins: [
    webExtension({
      manifest: generateManifest,
      browser: 'firefox',
      disableAutoLaunch: true,
      watchFilePaths: ['package.json', 'manifest.json'],
      webExtConfig: {
        target: 'firefox-desktop',
        firefoxBinary: '/usr/sbin/librewolf',
      },
    }),
  ],
})
