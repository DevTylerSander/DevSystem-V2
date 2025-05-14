const fs = require('fs').promises;
const path = require('path');

const STATS_FILE = path.join(__dirname, '../data/userStats.json');

async function ensureDataDir() {
    const dataDir = path.dirname(STATS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

async function initStatsFile() {
    try {
        await fs.access(STATS_FILE);
    } catch {
        await fs.writeFile(STATS_FILE, JSON.stringify({ stats: [] }));
    }
}

async function readStats() {
    await ensureDataDir();
    await initStatsFile();
    const data = await fs.readFile(STATS_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeStats(data) {
    await ensureDataDir();
    await fs.writeFile(STATS_FILE, JSON.stringify(data, null, 2));
}

async function getUserStats(userId, guildId) {
    const data = await readStats();
    return data.stats.find(
        entry => entry.userId === userId && entry.guildId === guildId
    ) || { userId, guildId, mute: 0, kick: 0, ban: 0 };
}

async function incrementStat(userId, guildId, type) {
    const data = await readStats();
    let entry = data.stats.find(
        e => e.userId === userId && e.guildId === guildId
    );
    if (!entry) {
        entry = { userId, guildId, mute: 0, kick: 0, ban: 0 };
        data.stats.push(entry);
    }
    if (['mute', 'kick', 'ban'].includes(type)) {
        entry[type] = (entry[type] || 0) + 1;
    }
    await writeStats(data);
}

module.exports = {
    getUserStats,
    incrementStat
}; 