const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Predefined reasons for muting
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
    { name: 'Breaking Channel Rules', value: 'Breaking Channel Rules' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the mute (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the mute')
                .setRequired(false)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('custom_reason')
                .setDescription('Custom reason (only use if "Other" is selected)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filtered = PREDEFINED_REASONS.filter(reason => 
            reason.name.toLowerCase().includes(focusedValue)
        );
        await interaction.respond(filtered);
    },

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
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

        // Check if the bot can moderate the target user
        if (!member?.moderatable) {
            return interaction.reply({
                content: 'I cannot mute this user! They may have higher permissions than me.',
                ephemeral: true
            });
        }

        // Check if the target user is moderatable by the command user
        if (interaction.member.roles.highest.position <= member.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot mute this user as they have the same or higher role than you!',
                ephemeral: true
            });
        }

        // Parse duration
        const durationMatch = duration.match(/^(\d+)([mhd])$/);
        if (!durationMatch) {
            return interaction.reply({
                content: 'Invalid duration format! Please use format like: 30m, 1h, 1d',
                ephemeral: true
            });
        }

        const [, amount, unit] = durationMatch;
        let milliseconds;

        switch (unit) {
            case 'm':
                milliseconds = parseInt(amount) * 60 * 1000;
                break;
            case 'h':
                milliseconds = parseInt(amount) * 60 * 60 * 1000;
                break;
            case 'd':
                milliseconds = parseInt(amount) * 24 * 60 * 60 * 1000;
                break;
            default:
                return interaction.reply({
                    content: 'Invalid time unit! Use m (minutes), h (hours), or d (days)',
                    ephemeral: true
                });
        }

        // Check if duration is within Discord's limits (28 days)
        if (milliseconds > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                content: 'Mute duration cannot be longer than 28 days!',
                ephemeral: true
            });
        }

        try {
            // Timeout the user
            await member.timeout(milliseconds, reason);

            // Format duration for display
            let durationDisplay;
            if (unit === 'm') durationDisplay = `${amount} minute${amount === '1' ? '' : 's'}`;
            else if (unit === 'h') durationDisplay = `${amount} hour${amount === '1' ? '' : 's'}`;
            else durationDisplay = `${amount} day${amount === '1' ? '' : 's'}`;

            // Send confirmation message
            await interaction.reply({
                content: `Successfully muted ${targetUser.tag} for ${durationDisplay}.\nReason: ${reason}`,
                ephemeral: true
            });

            // Try to DM the user about their mute
            try {
                await targetUser.send(`You have been muted in ${interaction.guild.name} for ${durationDisplay}\nReason: ${reason}`);
            } catch (error) {
                // If we can't DM the user, just log it and continue
                console.log(`Could not DM mute notification to ${targetUser.tag}`);
            }
        } catch (error) {
            console.error('Error in mute command:', error);
            await interaction.reply({
                content: 'There was an error trying to mute that user!',
                ephemeral: true
            });
        }
    },
}; 