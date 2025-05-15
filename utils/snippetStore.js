const fs = require('fs').promises;
const path = require('path');

const SNIPPETS_FILE = path.join(__dirname, '../data/snippets.json');

// Ensure the data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(SNIPPETS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Initialize snippets file if it doesn't exist
async function initSnippetsFile() {
    try {
        await fs.access(SNIPPETS_FILE);
    } catch {
        await fs.writeFile(SNIPPETS_FILE, JSON.stringify({ snippets: [] }, null, 2));
    }
}

// Read all snippets
async function readSnippets() {
    await ensureDataDir();
    await initSnippetsFile();
    try {
        const data = await fs.readFile(SNIPPETS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (parsed && Array.isArray(parsed.snippets)) {
            return parsed;
        } else {
            // If malformed, reset to empty
            return { snippets: [] };
        }
    } catch (e) {
        // If file is empty or invalid JSON, reset to empty
        return { snippets: [] };
    }
}

// Write snippets to file
async function writeSnippets(data) {
    await ensureDataDir();
    await fs.writeFile(SNIPPETS_FILE, JSON.stringify(data, null, 2));
}

// Create a new snippet
async function createSnippet(name, content, language, createdBy) {
    const data = await readSnippets();
    
    // Check if snippet name already exists
    if (data.snippets.some(s => s.name === name)) {
        throw new Error('A snippet with this name already exists');
    }

    // Store content as array of lines
    const contentLines = Array.isArray(content) ? content : content.split('\n');

    const snippet = {
        name,
        content: contentLines,
        language,
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.snippets.push(snippet);
    await writeSnippets(data);
    return snippet;
}

// Get a snippet by name
async function getSnippet(name) {
    const data = await readSnippets();
    return data.snippets.find(s => s.name === name);
}

// Update a snippet
async function updateSnippet(name, content, language) {
    const data = await readSnippets();
    const snippetIndex = data.snippets.findIndex(s => s.name === name);
    
    if (snippetIndex === -1) {
        throw new Error('Snippet not found');
    }

    // Store content as array of lines
    const contentLines = Array.isArray(content) ? content : content.split('\n');

    const snippet = data.snippets[snippetIndex];
    snippet.content = contentLines;
    snippet.language = language;
    snippet.updatedAt = new Date().toISOString();

    await writeSnippets(data);
    return snippet;
}

// Delete a snippet
async function deleteSnippet(name) {
    const data = await readSnippets();
    const snippetIndex = data.snippets.findIndex(s => s.name === name);
    
    if (snippetIndex === -1) {
        throw new Error('Snippet not found');
    }

    data.snippets.splice(snippetIndex, 1);
    await writeSnippets(data);
}

// Get all snippets (with optional filter)
async function getAllSnippets(filter = {}) {
    const data = await readSnippets();
    let snippets = data.snippets;

    // Apply filters
    if (filter.createdBy) {
        snippets = snippets.filter(s => s.createdBy === filter.createdBy);
    }
    if (filter.language) {
        snippets = snippets.filter(s => s.language === filter.language);
    }
    if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        snippets = snippets.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            s.content.toLowerCase().includes(searchTerm)
        );
    }

    return snippets;
}

module.exports = {
    createSnippet,
    getSnippet,
    updateSnippet,
    deleteSnippet,
    getAllSnippets
}; 