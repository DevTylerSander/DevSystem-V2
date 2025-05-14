const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isBlacklisted, getBlacklistEntry } = require('../../utils/blacklistStore');
const { getUserStats } = require('../../utils/userStatsStore');

// Function to format permissions
function formatPermissions(permissions) {
    const permissionNames = {
        'Administrator': '👑 Administrator',
        'ManageGuild': '⚙️ Manage Server',
        'ManageRoles': '👥 Manage Roles',
        'ManageChannels': '📝 Manage Channels',
        'ManageMessages': '💬 Manage Messages',
        'ManageNicknames': '📛 Manage Nicknames',
        'ManageEmojisAndStickers': '😀 Manage Emojis',
        'BanMembers': '🔨 Ban Members',
        'KickMembers': '👢 Kick Members',
        'ModerateMembers': '⏰ Moderate Members',
        'ViewAuditLog': '📋 View Audit Log',
        'ViewChannel': '👁️ View Channels',
        'SendMessages': '💭 Send Messages',
        'EmbedLinks': '🔗 Embed Links',
        'AttachFiles': '📎 Attach Files',
        'AddReactions': '😀 Add Reactions',
        'UseExternalEmojis': '😀 Use External Emojis',
        'MentionEveryone': '📢 Mention Everyone',
        'CreatePublicThreads': '🧵 Create Public Threads',
        'CreatePrivateThreads': '🔒 Create Private Threads',
        'SendMessagesInThreads': '💭 Send Messages in Threads',
        'UseExternalStickers': '🎨 Use External Stickers',
        'SendTTSMessages': '🔊 Send TTS Messages'
    };

    return Object.entries(permissions)
        .filter(([_, hasPermission]) => hasPermission)
        .map(([permission]) => permissionNames[permission] || permission)
        .join('\n');
}

// Function to format roles
function formatRoles(member) {
    if (!member.roles.cache.size) return 'No roles';
    return member.roles.cache
        .filter(role => role.id !== member.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .join(', ');
}

// Function to get user status
function getUserStatus(user) {
    if (!user.presence) return 'Offline';
    
    const status = {
        online: '🟢 Online',
        idle: '🟡 Idle',
        dnd: '🔴 Do Not Disturb',
        offline: '⚫ Offline'
    };
    
    return status[user.presence.status] || '⚫ Offline';
}

// Function to get user badges
function getUserBadges(user) {
    const badges = [];
    const flags = user.flags?.toArray() || [];

    const badgeEmojis = {
        'Staff': '👨‍💼',
        'Partner': '👑',
        'Hypesquad': '💎',
        'BugHunterLevel1': '🐛',
        'BugHunterLevel2': '🐛',
        'HypeSquadOnlineHouse1': '🏠',
        'HypeSquadOnlineHouse2': '🏠',
        'HypeSquadOnlineHouse3': '🏠',
        'PremiumEarlySupporter': '🎗️',
        'TeamPseudoUser': '👥',
        'VerifiedBot': '✅',
        'VerifiedDeveloper': '👨‍💻'
    };

    flags.forEach(flag => {
        if (badgeEmojis[flag]) {
            badges.push(`${badgeEmojis[flag]} ${flag.replace(/([A-Z])/g, ' $1').trim()}`);
        }
    });

    return badges.length ? badges.join('\n') : 'No badges';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get relevant server information about a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get information about')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const member = interaction.guild.members.cache.get(targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle(`User Info: ${targetUser.tag}`)
                .setColor(member?.displayHexColor || '#00ff00')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .setTimestamp();

            // Basic info
            embed.addFields(
                { name: 'Username', value: targetUser.tag, inline: true },
                { name: 'User ID', value: targetUser.id, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
            );

            // Server info
            if (member) {
                embed.addFields(
                    { name: 'Server Join Date', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Roles', value: formatRoles(member) || 'No roles', inline: false }
                );
            } else {
                embed.addFields(
                    { name: 'Server Join Date', value: 'Not in server', inline: true },
                    { name: 'Roles', value: 'Not in server', inline: false }
                );
            }

            // Blacklist info
            const isUserBlacklisted = await isBlacklisted(targetUser.id, interaction.guild.id);
            if (isUserBlacklisted) {
                const blacklistEntry = await getBlacklistEntry(targetUser.id, interaction.guild.id);
                embed.addFields({
                    name: 'Blacklisted',
                    value: `Yes\nReason: ${blacklistEntry.reason}`,
                    inline: true
                });
            } else {
                embed.addFields({ name: 'Blacklisted', value: 'No', inline: true });
            }

            // Mute/Kick/Ban counts
            const stats = await getUserStats(targetUser.id, interaction.guild.id);
            embed.addFields(
                { name: 'Mute Count', value: stats.mute.toString(), inline: true },
                { name: 'Kick Count', value: stats.kick.toString(), inline: true },
                { name: 'Ban Count', value: stats.ban.toString(), inline: true }
            );

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in info command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error while fetching user information!',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    },
}; 