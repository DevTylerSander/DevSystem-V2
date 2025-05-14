const fs = require('fs').promises;
const path = require('path');

const STICKY_FILE = path.join(__dirname, '../data/stickyMessages.json');

async function ensureDataDir() {
    const dataDir = path.dirname(STICKY_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function initStickyFile() {
    try {
        await fs.access(STICKY_FILE);
    } catch {
        await fs.writeFile(STICKY_FILE, JSON.stringify({ stickies: [] }));
    }
}

async function readStickies() {
    await ensureDataDir();
    await initStickyFile();
    const data = await fs.readFile(STICKY_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeStickies(data) {
    await ensureDataDir();
    await fs.writeFile(STICKY_FILE, JSON.stringify(data, null, 2));
}

async function setSticky(channelId, message) {
    const data = await readStickies();
    let entry = data.stickies.find(e => e.channelId === channelId);
    if (!entry) {
        entry = { channelId, message, lastMessageId: null };
        data.stickies.push(entry);
    } else {
        entry.message = message;
    }
    await writeStickies(data);
}

async function getSticky(channelId) {
    const data = await readStickies();
    return data.stickies.find(e => e.channelId === channelId) || null;
}

async function setLastStickyMessageId(channelId, messageId) {
    const data = await readStickies();
    let entry = data.stickies.find(e => e.channelId === channelId);
    if (entry) {
        entry.lastMessageId = messageId;
        await writeStickies(data);
    }
}

async function removeSticky(channelId) {
    const data = await readStickies();
    data.stickies = data.stickies.filter(e => e.channelId !== channelId);
    await writeStickies(data);
}

module.exports = {
    setSticky,
    getSticky,
    setLastStickyMessageId,
    removeSticky
}; 