const { clipboard } = require('electron');

let lastClipboardContent = '';
let lastCheckTime = 0;

function readText() {
  return clipboard.readText();
}

function writeText(text) {
  clipboard.writeText(text);
  return true;
}

function getLastClipboardContent() {
  return lastClipboardContent;
}

function setLastClipboardContent(content) {
  lastClipboardContent = content;
}

function getLastCheckTime() {
  return lastCheckTime;
}

function setLastCheckTime(time) {
  lastCheckTime = time;
}

module.exports = {
  readText,
  writeText,
  getLastClipboardContent,
  setLastClipboardContent,
  getLastCheckTime,
  setLastCheckTime
}; 