const fs = require('fs').promises;
const path = require('path');

const BLACKLIST_FILE = path.join(__dirname, '../data/blacklist.json');

// Ensure the data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(BLACKLIST_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize blacklist file if it doesn't exist
async function initBlacklistFile() {
    try {
        await fs.access(BLACKLIST_FILE);
    } catch {
        await fs.writeFile(BLACKLIST_FILE, JSON.stringify({ blacklistedUsers: [] }));
    }
}

// Read the blacklist data
async function readBlacklist() {
    await ensureDataDir();
    await initBlacklistFile();
    const data = await fs.readFile(BLACKLIST_FILE, 'utf8');
    return JSON.parse(data);
}

// Write the blacklist data
async function writeBlacklist(data) {
    await ensureDataDir();
    await fs.writeFile(BLACKLIST_FILE, JSON.stringify(data, null, 2));
}

// Add a user to the blacklist
async function addToBlacklist(userId, guildId, addedBy, reason) {
    const data = await readBlacklist();
    
    // Check if user is already blacklisted
    const existingIndex = data.blacklistedUsers.findIndex(
        user => user.userId === userId && user.guildId === guildId
    );

    if (existingIndex !== -1) {
        throw new Error('User already blacklisted');
    }

    // Add new blacklisted user
    data.blacklistedUsers.push({
        userId,
        guildId,
        addedBy,
        reason,
        addedAt: new Date().toISOString()
    });

    await writeBlacklist(data);
}

// Remove a user from the blacklist
async function removeFromBlacklist(userId, guildId) {
    const data = await readBlacklist();
    const initialLength = data.blacklistedUsers.length;
    
    data.blacklistedUsers = data.blacklistedUsers.filter(
        user => !(user.userId === userId && user.guildId === guildId)
    );

    if (data.blacklistedUsers.length === initialLength) {
        throw new Error('User not found in blacklist');
    }

    await writeBlacklist(data);
}

// Check if a user is blacklisted
async function isBlacklisted(userId, guildId) {
    const data = await readBlacklist();
    return data.blacklistedUsers.some(
        user => user.userId === userId && user.guildId === guildId
    );
}

// Get blacklist entry for a user
async function getBlacklistEntry(userId, guildId) {
    const data = await readBlacklist();
    return data.blacklistedUsers.find(
        user => user.userId === userId && user.guildId === guildId
    );
}

module.exports = {
    addToBlacklist,
    removeFromBlacklist,
    isBlacklisted,
    getBlacklistEntry,
    readBlacklist
}; 