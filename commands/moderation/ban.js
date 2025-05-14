const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(targetUser.id);

        // Check if the bot can ban the target user
        if (!member?.bannable) {
            return interaction.reply({
                content: 'I cannot ban this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        // Check if the target user is bannable by the command user
        if (interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot ban this user as they have the same or higher role than you!',
                ephemeral: true
            });
        }

        try {
            // Ban the user
            await member.ban({ reason: reason });

            // Send confirmation message
            await interaction.reply({
                content: `Successfully banned ${targetUser.tag} for reason: ${reason}`,
                ephemeral: true
            });

            // Try to DM the user about their ban
            try {
                await targetUser.send(`You have been banned from ${interaction.guild.name}\nReason: ${reason}`);
            } catch (error) {
                // If we can't DM the user, just log it and continue
                console.log(`Could not DM ban notification to ${targetUser.tag}`);
            }
        } catch (error) {
            console.error('Error in ban command:', error);
            await interaction.reply({
                content: 'There was an error trying to ban that user!',
                ephemeral: true
            });
        }
    },
}; 