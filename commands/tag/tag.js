const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/tags.json');

function loadTags() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveTags(tags) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tags, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Manage and use quick message tags')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the tag')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message for the tag')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a tag message to this channel')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the tag to send')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a tag message')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the tag to edit')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('New message for the tag')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the tag to delete')
                        .setRequired(true)
                        .setAutocomplete(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const tags = loadTags();

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const message = interaction.options.getString('message');
            if (tags[name]) {
                return await interaction.reply({ content: `A tag with the name "${name}" already exists.`, ephemeral: true });
            }
            tags[name] = message;
            saveTags(tags);
            await interaction.reply({ content: `Tag "${name}" created successfully!`, ephemeral: true });
        }
        else if (subcommand === 'send') {
            const name = interaction.options.getString('name');
            if (!tags[name]) {
                return await interaction.reply({ content: `No tag found with the name "${name}".`, ephemeral: true });
            }
            await interaction.channel.send(tags[name]);
            await interaction.reply({ content: `Tag "${name}" sent in this channel.`, ephemeral: true });
        }
        else if (subcommand === 'edit') {
            const name = interaction.options.getString('name');
            const message = interaction.options.getString('message');
            if (!tags[name]) {
                return await interaction.reply({ content: `No tag found with the name "${name}".`, ephemeral: true });
            }
            tags[name] = message;
            saveTags(tags);
            await interaction.reply({ content: `Tag "${name}" updated successfully!`, ephemeral: true });
        }
        else if (subcommand === 'delete') {
            const name = interaction.options.getString('name');
            if (!tags[name]) {
                return await interaction.reply({ content: `No tag found with the name "${name}".`, ephemeral: true });
            }
            delete tags[name];
            saveTags(tags);
            await interaction.reply({ content: `Tag "${name}" deleted successfully!`, ephemeral: true });
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const tags = loadTags();
        const tagNames = Object.keys(tags);
        const filtered = tagNames.filter(name =>
            name.toLowerCase().includes(focusedValue.toLowerCase())
        ).map(name => ({ name, value: name }));
        try {
            await interaction.respond(filtered.slice(0, 25));
        } catch (err) {
            console.error('Autocomplete respond error:', err);
        }
    },
}; 