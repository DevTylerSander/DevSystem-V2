const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getGuildEmbeds, getEmbed, createEmbed, updateEmbed, deleteEmbed } = require('../../utils/embedStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Manage custom embeds')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new embed')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name to save this embed as')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a saved embed')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the embed to send')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the embed to')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a saved embed')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the embed to edit')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a saved embed')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the embed to delete')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'create':
                    await handleCreate(interaction);
                    break;
                case 'send':
                    await handleSend(interaction);
                    break;
                case 'edit':
                    await handleEdit(interaction);
                    break;
                case 'delete':
                    await handleDelete(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in embed command:', error);
            await interaction.reply({
                content: error.message || 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    },

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const subcommand = interaction.options.getSubcommand();

        // Only handle autocomplete for name options in send, edit, and delete commands
        if (focusedOption.name === 'name' && ['send', 'edit', 'delete'].includes(subcommand)) {
            try {
                // Get all embeds for this guild
                const embeds = await getGuildEmbeds(interaction.guild.id);

                // Filter embeds based on user input
                const filtered = embeds
                    .map(embed => embed.name)
                    .filter(name => name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .slice(0, 25); // Discord has a limit of 25 choices

                await interaction.respond(
                    filtered.map(name => ({ name, value: name }))
                );
            } catch (error) {
                console.error('Error in embed autocomplete:', error);
                await interaction.respond([]);
            }
        }
    }
};

async function handleCreate(interaction) {
    const name = interaction.options.getString('name');
    
    // Check if embed with this name already exists
    const existingEmbed = await getEmbed(name, interaction.guild.id);

    if (existingEmbed) {
        return await interaction.reply({
            content: `An embed with the name "${name}" already exists!`,
            ephemeral: true
        });
    }

    // Create modal for embed creation
    const modal = new ModalBuilder()
        .setCustomId(`embed_create_${name}`)
        .setTitle('Create Embed');

    // Add text inputs for embed properties
    const titleInput = new TextInputBuilder()
        .setCustomId('title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    const colorInput = new TextInputBuilder()
        .setCustomId('color')
        .setLabel('Color (hex code)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('#0099ff')
        .setRequired(false);

    const thumbnailInput = new TextInputBuilder()
        .setCustomId('thumbnail')
        .setLabel('Thumbnail URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const imageInput = new TextInputBuilder()
        .setCustomId('image')
        .setLabel('Image URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    // Add inputs to modal
    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(thumbnailInput),
        new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);

    // Handle modal submit
    const filter = i => i.customId === `embed_create_${name}`;
    const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300000 });

    const title = modalSubmit.fields.getTextInputValue('title');
    const description = modalSubmit.fields.getTextInputValue('description');
    const color = modalSubmit.fields.getTextInputValue('color') || '#0099ff';
    const thumbnail = modalSubmit.fields.getTextInputValue('thumbnail');
    const image = modalSubmit.fields.getTextInputValue('image');

    // Create embed in storage
    await createEmbed({
        name,
        title,
        description,
        color,
        thumbnail,
        image,
        createdBy: interaction.user.id,
        guildId: interaction.guild.id
    });

    // Create preview embed
    const previewEmbed = new EmbedBuilder()
        .setTitle(title || null)
        .setDescription(description || null)
        .setColor(color)
        .setThumbnail(thumbnail || null)
        .setImage(image || null)
        .setFooter({ text: `Created by ${interaction.user.tag}` })
        .setTimestamp();

    await modalSubmit.reply({
        content: `Embed "${name}" has been created! Here's a preview:`,
        embeds: [previewEmbed],
        ephemeral: true
    });
}

async function handleSend(interaction) {
    const name = interaction.options.getString('name');
    const channel = interaction.options.getChannel('channel');

    const embed = await getEmbed(name, interaction.guild.id);

    if (!embed) {
        return await interaction.reply({
            content: `No embed found with the name "${name}"!`,
            ephemeral: true
        });
    }

    const discordEmbed = new EmbedBuilder()
        .setTitle(embed.title || null)
        .setDescription(embed.description || null)
        .setColor(embed.color)
        .setThumbnail(embed.thumbnail || null)
        .setImage(embed.image || null)
        .setFooter(embed.footer || null)
        .setAuthor(embed.author || null);

    if (embed.fields && embed.fields.length > 0) {
        embed.fields.forEach(field => {
            discordEmbed.addFields(field);
        });
    }

    await channel.send({ embeds: [discordEmbed] });
    await interaction.reply({
        content: `Embed "${name}" has been sent to ${channel}!`,
        ephemeral: true
    });
}

async function handleEdit(interaction) {
    const name = interaction.options.getString('name');

    const embed = await getEmbed(name, interaction.guild.id);

    if (!embed) {
        return await interaction.reply({
            content: `No embed found with the name "${name}"!`,
            ephemeral: true
        });
    }

    // Create modal for editing
    const modal = new ModalBuilder()
        .setCustomId(`embed_edit_${name}`)
        .setTitle('Edit Embed');

    // Add text inputs for embed properties
    const titleInput = new TextInputBuilder()
        .setCustomId('title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setValue(embed.title || '')
        .setRequired(false);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(embed.description || '')
        .setRequired(false);

    const colorInput = new TextInputBuilder()
        .setCustomId('color')
        .setLabel('Color (hex code)')
        .setStyle(TextInputStyle.Short)
        .setValue(embed.color || '#0099ff')
        .setRequired(false);

    const thumbnailInput = new TextInputBuilder()
        .setCustomId('thumbnail')
        .setLabel('Thumbnail URL')
        .setStyle(TextInputStyle.Short)
        .setValue(embed.thumbnail || '')
        .setRequired(false);

    const imageInput = new TextInputBuilder()
        .setCustomId('image')
        .setLabel('Image URL')
        .setStyle(TextInputStyle.Short)
        .setValue(embed.image || '')
        .setRequired(false);

    // Add inputs to modal
    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(thumbnailInput),
        new ActionRowBuilder().addComponents(imageInput)
    );

    await interaction.showModal(modal);

    // Handle modal submit
    const filter = i => i.customId === `embed_edit_${name}`;
    const modalSubmit = await interaction.awaitModalSubmit({ filter, time: 300000 });

    const title = modalSubmit.fields.getTextInputValue('title');
    const description = modalSubmit.fields.getTextInputValue('description');
    const color = modalSubmit.fields.getTextInputValue('color') || '#0099ff';
    const thumbnail = modalSubmit.fields.getTextInputValue('thumbnail');
    const image = modalSubmit.fields.getTextInputValue('image');

    // Update embed in storage
    await updateEmbed(name, interaction.guild.id, {
        title,
        description,
        color,
        thumbnail,
        image
    });

    // Create preview embed
    const previewEmbed = new EmbedBuilder()
        .setTitle(title || null)
        .setDescription(description || null)
        .setColor(color)
        .setThumbnail(thumbnail || null)
        .setImage(image || null)
        .setFooter({ text: `Updated by ${interaction.user.tag}` })
        .setTimestamp();

    await modalSubmit.reply({
        content: `Embed "${name}" has been updated! Here's a preview:`,
        embeds: [previewEmbed],
        ephemeral: true
    });
}

async function handleDelete(interaction) {
    const name = interaction.options.getString('name');

    const embed = await getEmbed(name, interaction.guild.id);

    if (!embed) {
        return await interaction.reply({
            content: `No embed found with the name "${name}"!`,
            ephemeral: true
        });
    }

    // Create confirmation buttons
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_delete')
                .setLabel('Delete')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_delete')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    const response = await interaction.reply({
        content: `Are you sure you want to delete the embed "${name}"?`,
        components: [row],
        ephemeral: true
    });

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time: 30000
        });

        if (confirmation.customId === 'confirm_delete') {
            await deleteEmbed(name, interaction.guild.id);
            await confirmation.update({
                content: `Embed "${name}" has been deleted!`,
                components: []
            });
        } else {
            await confirmation.update({
                content: 'Embed deletion cancelled.',
                components: []
            });
        }
    } catch (e) {
        await interaction.editReply({
            content: 'Confirmation not received within 30 seconds, cancelling.',
            components: []
        });
    }
} 