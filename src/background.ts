/* eslint-disable no-console */
import browser from 'webextension-polyfill'

console.log('Hello from the background!')

browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details)
})
