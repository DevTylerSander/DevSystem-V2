const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setSticky, removeSticky } = require('../../utils/stickyStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Set or remove a sticky message for this channel')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The sticky message to set (leave empty to remove sticky)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const channelId = interaction.channel.id;

        if (!message) {
            // Remove sticky
            await removeSticky(channelId);
            await interaction.reply({
                content: 'Sticky message removed for this channel.',
                ephemeral: true
            });
            return;
        }

        // Set sticky as embed
        await setSticky(channelId, message);
        const embed = new EmbedBuilder()
            .setTitle('Sticky Message')
            .setDescription(message)
            .setColor('#FFD700');
        await interaction.reply({
            embeds: [embed],
            content: 'Sticky message set for this channel!',
            ephemeral: true
        });
    },
}; 