const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/developers.json');

function readDevelopers() {
    if (!fs.existsSync(DATA_PATH)) return {};
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeDevelopers(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev')
        .setDescription('Manage developer roles and information')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a developer role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add as a developer')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('github')
                        .setDescription('GitHub profile link')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('website')
                        .setDescription('Website link')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove developer role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove as a developer')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View information about a developer')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The developer to view information about')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update a developer\'s information')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The developer to update information for')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('github')
                        .setDescription('GitHub profile link')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('website')
                        .setDescription('Website link')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');

        switch (subcommand) {
            case 'add':
                await handleAdd(interaction, targetUser);
                break;
            case 'remove':
                await handleRemove(interaction, targetUser);
                break;
            case 'info':
                await handleInfo(interaction, targetUser);
                break;
            case 'update':
                await handleUpdate(interaction, targetUser);
                break;
        }
    }
};

async function handleAdd(interaction, targetUser) {
    const developers = readDevelopers();
    if (developers[targetUser.id]) {
        return await interaction.reply({
            content: `${targetUser.username} is already registered as a developer.`,
            ephemeral: true
        });
    }

    const github = interaction.options.getString('github') || '';
    const website = interaction.options.getString('website') || '';

    const modal = new ModalBuilder()
        .setCustomId(`dev_modal_${targetUser.id}`)
        .setTitle('Developer Information Form');

    const languagesInput = new TextInputBuilder()
        .setCustomId('languages')
        .setLabel('Programming Languages')
        .setPlaceholder('List the programming languages you know (comma-separated)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    const experienceInput = new TextInputBuilder()
        .setCustomId('experience')
        .setLabel('Experience')
        .setPlaceholder('Describe your programming experience')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    const aboutInput = new TextInputBuilder()
        .setCustomId('about')
        .setLabel('About')
        .setPlaceholder('Tell us about yourself')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    const specialtiesInput = new TextInputBuilder()
        .setCustomId('specialties')
        .setLabel('Specialties')
        .setPlaceholder('What are your programming specialties? (e.g., Web Development, Bot Development)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(languagesInput),
        new ActionRowBuilder().addComponents(experienceInput),
        new ActionRowBuilder().addComponents(aboutInput),
        new ActionRowBuilder().addComponents(specialtiesInput)
    );

    await interaction.showModal(modal);

    try {
        const filter = i => i.customId === `dev_modal_${targetUser.id}`;
        const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300000 });

        const languages = modalSubmit.fields.getTextInputValue('languages');
        const experience = modalSubmit.fields.getTextInputValue('experience');
        const about = modalSubmit.fields.getTextInputValue('about');
        const specialties = modalSubmit.fields.getTextInputValue('specialties');

        developers[targetUser.id] = {
            languages: languages.split(',').map(lang => lang.trim()),
            experience,
            about,
            specialties: specialties.split(',').map(spec => spec.trim()),
            website,
            github,
            addedBy: interaction.user.id,
            addedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        writeDevelopers(developers);

        const member = await interaction.guild.members.fetch(targetUser.id);
        const devRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'developer');
        if (devRole) {
            await member.roles.add(devRole);
        }

        await modalSubmit.reply({
            content: `Successfully added ${targetUser.username} as a developer!`,
            ephemeral: true
        });
    } catch (error) {
        if (error.code === 'InteractionCollectorError') {
            await interaction.followUp({
                content: 'Developer information form timed out. Please try again.',
                ephemeral: true
            });
        } else {
            console.error(error);
            await interaction.followUp({
                content: 'There was an error while processing the developer information.',
                ephemeral: true
            });
        }
    }
}

async function handleRemove(interaction, targetUser) {
    const developers = readDevelopers();
    if (!developers[targetUser.id]) {
        return await interaction.reply({
            content: `${targetUser.username} is not registered as a developer.`,
            ephemeral: true
        });
    }

    const member = await interaction.guild.members.fetch(targetUser.id);
    const devRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'developer');
    if (devRole) {
        await member.roles.remove(devRole);
    }

    delete developers[targetUser.id];
    writeDevelopers(developers);

    await interaction.reply({
        content: `Successfully removed ${targetUser.username} as a developer.`,
        ephemeral: true
    });
}

async function handleInfo(interaction, targetUser) {
    const developers = readDevelopers();
    const devInfo = developers[targetUser.id];
    if (!devInfo) {
        return await interaction.reply({
            content: `${targetUser.username} is not registered as a developer.`,
            ephemeral: true
        });
    }

    const embed = {
        color: 0x0099ff,
        title: `Developer Information - ${targetUser.username}`,
        thumbnail: {
            url: targetUser.displayAvatarURL()
        },
        fields: [
            {
                name: 'Programming Languages',
                value: devInfo.languages.join(', '),
                inline: false
            },
            {
                name: 'Experience',
                value: devInfo.experience,
                inline: false
            },
            {
                name: 'About',
                value: devInfo.about,
                inline: false
            },
            {
                name: 'Specialties',
                value: devInfo.specialties.join(', '),
                inline: false
            },
            {
                name: 'Added By',
                value: `<@${devInfo.addedBy}>`,
                inline: true
            },
            {
                name: 'Added At',
                value: new Date(devInfo.addedAt).toLocaleDateString(),
                inline: true
            },
            {
                name: 'Last Updated',
                value: new Date(devInfo.lastUpdated).toLocaleDateString(),
                inline: true
            }
        ],
        timestamp: new Date().toISOString()
    };

    const components = [];
    const row = { type: 1, components: [] };
    if (devInfo.website) {
        row.components.push({
            type: 2,
            style: 5,
            label: 'Website',
            url: devInfo.website
        });
    }
    if (devInfo.github) {
        row.components.push({
            type: 2,
            style: 5,
            label: 'GitHub',
            url: devInfo.github
        });
    }
    if (row.components.length) components.push(row);

    await interaction.reply({ embeds: [embed], components });
}

async function handleUpdate(interaction, targetUser) {
    const developers = readDevelopers();
    const devInfo = developers[targetUser.id];
    if (!devInfo) {
        return await interaction.reply({
            content: `${targetUser.username} is not registered as a developer.`,
            ephemeral: true
        });
    }

    const github = interaction.options.getString('github') ?? devInfo.github ?? '';
    const website = interaction.options.getString('website') ?? devInfo.website ?? '';

    const modal = new ModalBuilder()
        .setCustomId(`dev_update_modal_${targetUser.id}`)
        .setTitle('Update Developer Information');

    const languagesInput = new TextInputBuilder()
        .setCustomId('languages')
        .setLabel('Programming Languages')
        .setPlaceholder('List the programming languages you know (comma-separated)')
        .setValue(devInfo.languages.join(', '))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    const experienceInput = new TextInputBuilder()
        .setCustomId('experience')
        .setLabel('Experience')
        .setPlaceholder('Describe your programming experience')
        .setValue(devInfo.experience)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    const aboutInput = new TextInputBuilder()
        .setCustomId('about')
        .setLabel('About')
        .setPlaceholder('Tell us about yourself')
        .setValue(devInfo.about)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    const specialtiesInput = new TextInputBuilder()
        .setCustomId('specialties')
        .setLabel('Specialties')
        .setPlaceholder('What are your programming specialties? (e.g., Web Development, Bot Development)')
        .setValue(devInfo.specialties.join(', '))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(languagesInput),
        new ActionRowBuilder().addComponents(experienceInput),
        new ActionRowBuilder().addComponents(aboutInput),
        new ActionRowBuilder().addComponents(specialtiesInput)
    );

    await interaction.showModal(modal);

    try {
        const filter = i => i.customId === `dev_update_modal_${targetUser.id}`;
        const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300000 });

        const languages = modalSubmit.fields.getTextInputValue('languages');
        const experience = modalSubmit.fields.getTextInputValue('experience');
        const about = modalSubmit.fields.getTextInputValue('about');
        const specialties = modalSubmit.fields.getTextInputValue('specialties');

        developers[targetUser.id] = {
            ...devInfo,
            languages: languages.split(',').map(lang => lang.trim()),
            experience,
            about,
            specialties: specialties.split(',').map(spec => spec.trim()),
            website,
            github,
            lastUpdated: new Date().toISOString()
        };
        writeDevelopers(developers);

        await modalSubmit.reply({
            content: `Successfully updated ${targetUser.username}'s developer information!`,
            ephemeral: true
        });
    } catch (error) {
        if (error.code === 'InteractionCollectorError') {
            await interaction.followUp({
                content: 'Developer information update form timed out. Please try again.',
                ephemeral: true
            });
        } else {
            console.error(error);
            await interaction.followUp({
                content: 'There was an error while updating the developer information.',
                ephemeral: true
            });
        }
    }
} 