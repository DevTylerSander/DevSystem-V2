const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Predefined reasons for kicking (reusing the same reasons as mute for consistency)
const PREDEFINED_REASONS = [
    { name: 'Spamming', value: 'Spamming' },
    { name: 'Inappropriate Language', value: 'Inappropriate Language' },
    { name: 'Harassment', value: 'Harassment' },
    { name: 'Disrespectful Behavior', value: 'Disrespectful Behavior' },
    { name: 'NSFW Content', value: 'NSFW Content' },
    { name: 'Excessive Caps', value: 'Excessive Caps' },
    { name: 'Off-topic Discussion', value: 'Off-topic Discussion' },
    { name: 'Toxic Behavior', value: 'Toxic Behavior' },
    { name: 'Raid Prevention', value: 'Raid Prevention' },
    { name: 'Breaking Channel Rules', value: 'Breaking Channel Rules' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(false)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('custom_reason')
                .setDescription('Custom reason (only use if "Other" is selected)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filtered = PREDEFINED_REASONS.filter(reason => 
            reason.name.toLowerCase().includes(focusedValue)
        );
        await interaction.respond(filtered);
    },

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        let reason = interaction.options.getString('reason');
        const customReason = interaction.options.getString('custom_reason');
        const member = interaction.guild.members.cache.get(targetUser.id);

        // Handle reason selection
        if (reason === 'other') {
            if (!customReason) {
                return interaction.reply({
                    content: 'Please provide a custom reason when selecting "Other"',
                    ephemeral: true
                });
            }
            reason = customReason;
        } else if (!reason) {
            reason = 'No reason provided';
        }

        // Check if the bot can kick the target user
        if (!member?.kickable) {
            return interaction.reply({
                content: 'I cannot kick this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        // Check if the target user is kickable by the command user
        if (interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot kick this user as they have the same or higher role than you!',
                ephemeral: true
            });
        }

        try {
            // Try to DM the user about their kick
            try {
                await targetUser.send(`You have been kicked from ${interaction.guild.name}\nReason: ${reason}`);
            } catch (error) {
                // If we can't DM the user, just log it and continue
                console.log(`Could not DM kick notification to ${targetUser.tag}`);
            }

            // Kick the user
            await member.kick(reason);

            // Send confirmation message
            await interaction.reply({
                content: `Successfully kicked ${targetUser.tag}.\nReason: ${reason}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in kick command:', error);
            await interaction.reply({
                content: 'There was an error trying to kick that user!',
                ephemeral: true
            });
        }
    },
}; 