const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/development_categories.json');

function loadCategories() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveCategories(categories) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(categories, null, 2));
}

function addCategory(name) {
    const categories = loadCategories();
    if (!categories.includes(name)) {
        categories.push(name);
        saveCategories(categories);
    }
}

function removeCategory(name) {
    let categories = loadCategories();
    categories = categories.filter(cat => cat !== name);
    saveCategories(categories);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('development')
        .setDescription('Manage development channels for testing bots')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create new channels and role for testing bots')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the development category')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of channel to create')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Text', value: 'text' },
                            { name: 'Voice', value: 'voice' },
                            { name: 'Forum', value: 'forum' },
                            { name: 'Announcement', value: 'announcement' },
                            { name: 'All Types', value: 'all' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete development channels')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the development category to delete')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if the command is being used inside a development channel
        const currentChannel = interaction.channel;
        if (currentChannel.parent && currentChannel.parent.type === ChannelType.GuildCategory) {
            const categoryName = currentChannel.parent.name;
            // Check if we're in a development category
            if (categoryName === interaction.options.getString('name')) {
                return await interaction.reply({
                    content: 'You cannot use this command inside a development channel. Please use it in a regular channel.',
                    ephemeral: true
                });
            }
        }

        const subcommand = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');

        if (subcommand === 'create') {
            const type = interaction.options.getString('type');
            await handleCreate(interaction, name, type);
            addCategory(name); // Save category name
        } else if (subcommand === 'delete') {
            await handleDelete(interaction, name);
            removeCategory(name); // Remove category name
        }
    }
};

async function handleCreate(interaction, name, type) {
    try {
        // Create the role first
        const role = await interaction.guild.roles.create({
            name: `${name}`,
            reason: 'Development channel role',
            permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });

        // Create the category
        const category = await interaction.guild.channels.create({
            name: `${name}`,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: role.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                }
            ]
        });

        const channels = [];
        const channelTypes = type === 'all' 
            ? ['text', 'voice', 'forum', 'announcement']
            : [type];

        // Always create a commands channel
        const commandsChannel = await interaction.guild.channels.create({
            name: 'commands',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: role.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                }
            ]
        });
        channels.push(commandsChannel);

        for (const channelType of channelTypes) {
            let channel;
            switch (channelType) {
                case 'text':
                    channel = await interaction.guild.channels.create({
                        name: 'general',
                        type: ChannelType.GuildText,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: role.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                    break;
                case 'voice':
                    channel = await interaction.guild.channels.create({
                        name: 'voice',
                        type: ChannelType.GuildVoice,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: role.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                    break;
                case 'forum':
                    channel = await interaction.guild.channels.create({
                        name: 'forum',
                        type: ChannelType.GuildForum,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: role.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                    break;
                case 'announcement':
                    channel = await interaction.guild.channels.create({
                        name: 'announcements',
                        type: ChannelType.GuildAnnouncement,
                        parent: category.id,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: role.id,
                                allow: [PermissionFlagsBits.ViewChannel],
                            }
                        ]
                    });
                    break;
            }
            if (channel) channels.push(channel);
        }

        const channelList = channels.map(ch => ch.name).join('\n');
        await interaction.reply({
            content: `Successfully created development environment:\nCategory: ${category.name}\nRole: ${role.name}\nChannels:\n${channelList}\n\nRole ID: ${role.id}`,
            ephemeral: true
        });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error creating the development environment.',
            ephemeral: true
        });
    }
}

async function handleDelete(interaction, name) {
    try {
        const categoryName = `${name}`;
        const category = interaction.guild.channels.cache.find(
            channel => channel.name === categoryName && channel.type === ChannelType.GuildCategory
        );

        if (!category) {
            return await interaction.reply({
                content: `Could not find development category "${categoryName}"`,
                ephemeral: true
            });
        }

        // Delete all channels in the category
        const channels = interaction.guild.channels.cache.filter(
            channel => channel.parentId === category.id
        );

        for (const channel of channels.values()) {
            await channel.delete();
        }

        // Delete the category
        await category.delete();

        // Delete the role
        const role = interaction.guild.roles.cache.find(role => role.name === categoryName);
        if (role) {
            await role.delete();
        }

        await interaction.reply({
            content: `Successfully deleted development environment "${categoryName}"`,
            ephemeral: true
        });

    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error deleting the development environment.',
            ephemeral: true
        });
    }
} 