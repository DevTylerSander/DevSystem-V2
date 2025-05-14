const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete a specified number of messages')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Defer the reply since this might take a moment
        await interaction.deferReply({ ephemeral: true });

        const count = interaction.options.getInteger('count');

        try {
            // Fetch and delete messages
            const messages = await interaction.channel.messages.fetch({ limit: count });
            await interaction.channel.bulkDelete(messages, true);

            // Send confirmation message
            await interaction.editReply({
                content: `Successfully deleted ${messages.size} messages.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in purge command:', error);
            await interaction.editReply({
                content: 'There was an error trying to delete messages. Make sure the messages are not older than 14 days.',
                ephemeral: true
            });
        }
    },
}; 