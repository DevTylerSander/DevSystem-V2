const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('errorlogs')
        .setDescription('Upload an error log file (.txt only)')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('The error log file (.txt only)')
                .setRequired(true)),

    async execute(interaction) {
        const file = interaction.options.getAttachment('file');

        if (!file || !file.name.endsWith('.txt')) {
            return await interaction.reply({
                content: 'Please upload a valid .txt file only.',
                ephemeral: true
            });
        }

        // Send the error log as a message in the channel, tagging the user
        await interaction.reply({
            content: `Error log submitted by <@${interaction.user.id}>:`,
            files: [file.url],
            ephemeral: false
        });
    },
}; 