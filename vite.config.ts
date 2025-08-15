import basicSsl from '@vitejs/plugin-basic-ssl'
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
    basicSsl(),
    webExtension({
      manifest: generateManifest,
      browser: 'firefox',
      // disableAutoLaunch: true,
      watchFilePaths: ['package.json', 'manifest.json'],
      webExtConfig: {
        target: 'firefox-desktop',
        firefox: 'flatpak:org.mozilla.FirefoxDev',
        args: [''],
        startUrl: 'moz-extension://30f47bc9-4bc9-4b67-be47-7f02b09b3e9e/src/popup.html',
      },
    }),
  ],
})
