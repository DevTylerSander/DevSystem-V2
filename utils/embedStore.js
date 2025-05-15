const fs = require('fs').promises;
const path = require('path');

const EMBEDS_FILE = path.join(__dirname, '../data/embeds.json');

// Ensure the data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(EMBEDS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize embeds file if it doesn't exist
async function initEmbedsFile() {
    try {
        await fs.access(EMBEDS_FILE);
    } catch {
        await fs.writeFile(EMBEDS_FILE, JSON.stringify({ embeds: [] }));
    }
}

// Read all embeds
async function readEmbeds() {
    await ensureDataDir();
    await initEmbedsFile();
    const data = await fs.readFile(EMBEDS_FILE, 'utf8');
    return JSON.parse(data);
}

// Write embeds to file
async function writeEmbeds(data) {
    await ensureDataDir();
    await fs.writeFile(EMBEDS_FILE, JSON.stringify(data, null, 2));
}

// Get all embeds for a guild
async function getGuildEmbeds(guildId) {
    const data = await readEmbeds();
    return data.embeds.filter(embed => embed.guildId === guildId);
}

// Get a specific embed by name and guild
async function getEmbed(name, guildId) {
    const data = await readEmbeds();
    return data.embeds.find(embed => embed.name === name && embed.guildId === guildId);
}

// Create a new embed
async function createEmbed(embedData) {
    const data = await readEmbeds();
    
    // Check if embed with this name already exists in the guild
    const exists = data.embeds.some(embed => 
        embed.name === embedData.name && embed.guildId === embedData.guildId
    );
    
    if (exists) {
        throw new Error(`An embed with the name "${embedData.name}" already exists in this server!`);
    }

    // Add creation timestamp
    embedData.createdAt = new Date().toISOString();
    embedData.updatedAt = embedData.createdAt;

    data.embeds.push(embedData);
    await writeEmbeds(data);
    return embedData;
}

// Update an existing embed
async function updateEmbed(name, guildId, updateData) {
    const data = await readEmbeds();
    const index = data.embeds.findIndex(embed => 
        embed.name === name && embed.guildId === guildId
    );

    if (index === -1) {
        throw new Error(`No embed found with the name "${name}"!`);
    }

    // Update the embed
    data.embeds[index] = {
        ...data.embeds[index],
        ...updateData,
        updatedAt: new Date().toISOString()
    };

    await writeEmbeds(data);
    return data.embeds[index];
}

// Delete an embed
async function deleteEmbed(name, guildId) {
    const data = await readEmbeds();
    const index = data.embeds.findIndex(embed => 
        embed.name === name && embed.guildId === guildId
    );

    if (index === -1) {
        throw new Error(`No embed found with the name "${name}"!`);
    }

    data.embeds.splice(index, 1);
    await writeEmbeds(data);
}

module.exports = {
    getGuildEmbeds,
    getEmbed,
    createEmbed,
    updateEmbed,
    deleteEmbed
}; 