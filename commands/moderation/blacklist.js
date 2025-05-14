const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { addToBlacklist, removeFromBlacklist, readBlacklist } = require('../../utils/blacklistStore');

// Predefined reasons for blacklisting (reusing the same reasons as other moderation commands for consistency)
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

// Function to get or create the System category
async function getOrCreateSystemCategory(guild) {
    const categoryName = `${guild.name} System`;
    let category = guild.channels.cache.find(
        channel => channel.type === ChannelType.GuildCategory && channel.name === categoryName
    );

    if (!category) {
        category = await guild.channels.create({
            name: categoryName,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: guild.members.me.id, // Bot
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });
    }

    return category;
}

// Function to create paginated embed for blacklist
async function createBlacklistEmbed(blacklistedUsers, page, interaction) {
    const USERS_PER_PAGE = 5;
    const totalPages = Math.ceil(blacklistedUsers.length / USERS_PER_PAGE);
    const startIndex = (page - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;
    const currentPageUsers = blacklistedUsers.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
        .setTitle('Server Blacklist')
        .setColor('#FF0000')
        .setDescription(`List of blacklisted users in this server (Page ${page}/${totalPages}):`)
        .setTimestamp();

    for (const user of currentPageUsers) {
        try {
            const discordUser = await interaction.client.users.fetch(user.userId);
            const addedByUser = await interaction.client.users.fetch(user.addedBy);
            const addedAt = new Date(user.addedAt).toLocaleString();

            embed.addFields({
                name: `User: ${discordUser.tag}`,
                value: `**Reason:** ${user.reason}\n**Added by:** ${addedByUser.tag}\n**Added at:** ${addedAt}`,
                inline: false
            });
        } catch (error) {
            // If we can't fetch the user, they might have left Discord
            embed.addFields({
                name: `User ID: ${user.userId}`,
                value: `**Reason:** ${user.reason}\n**Added by:** Unknown\n**Added at:** ${new Date(user.addedAt).toLocaleString()}`,
                inline: false
            });
        }
    }

    // Add footer with total count
    embed.setFooter({ 
        text: `Total blacklisted users: ${blacklistedUsers.length}`
    });

    return embed;
}

// Function to create navigation buttons
function createNavigationButtons(page, totalPages) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('first')
                .setLabel('≪ First')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId('prev')
                .setLabel('< Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next >')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages),
            new ButtonBuilder()
                .setCustomId('last')
                .setLabel('Last ≫')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages)
        );

    return row;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage user blacklist')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to blacklist')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for blacklisting')
                        .setRequired(false)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('custom_reason')
                        .setDescription('Custom reason (only use if "Other" is selected)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from blacklist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the current blacklist')),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filtered = PREDEFINED_REASONS.filter(reason => 
            reason.name.toLowerCase().includes(focusedValue)
        );
        await interaction.respond(filtered);
    },

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            // Handle view subcommand
            if (subcommand === 'view') {
                try {
                    const data = await readBlacklist();
                    const guildBlacklist = data.blacklistedUsers.filter(
                        user => user.guildId === interaction.guild.id
                    );

                    if (guildBlacklist.length === 0) {
                        return await interaction.reply({
                            content: 'There are no blacklisted users in this server.',
                            ephemeral: true
                        });
                    }

                    const totalPages = Math.ceil(guildBlacklist.length / 5);
                    let currentPage = 1;

                    // Create initial embed and buttons
                    const embed = await createBlacklistEmbed(guildBlacklist, currentPage, interaction);
                    const buttons = createNavigationButtons(currentPage, totalPages);

                    // Send initial message with buttons
                    const message = await interaction.reply({
                        embeds: [embed],
                        components: [buttons],
                        ephemeral: true
                    });

                    // Create button collector
                    const collector = message.createMessageComponentCollector({
                        time: 300000 // 5 minutes
                    });

                    collector.on('collect', async (i) => {
                        if (i.user.id !== interaction.user.id) {
                            await i.reply({
                                content: 'You cannot use these buttons.',
                                ephemeral: true
                            });
                            return;
                        }

                        switch (i.customId) {
                            case 'first':
                                currentPage = 1;
                                break;
                            case 'prev':
                                currentPage = Math.max(1, currentPage - 1);
                                break;
                            case 'next':
                                currentPage = Math.min(totalPages, currentPage + 1);
                                break;
                            case 'last':
                                currentPage = totalPages;
                                break;
                        }

                        // Update embed and buttons
                        const updatedEmbed = await createBlacklistEmbed(guildBlacklist, currentPage, interaction);
                        const updatedButtons = createNavigationButtons(currentPage, totalPages);

                        await i.update({
                            embeds: [updatedEmbed],
                            components: [updatedButtons]
                        });
                    });

                    collector.on('end', () => {
                        // Remove buttons when collector expires
                        interaction.editReply({
                            components: []
                        }).catch(console.error);
                    });

                    return;
                } catch (error) {
                    console.error('Error in blacklist view command:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: 'There was an error trying to view the blacklist!',
                            ephemeral: true
                        }).catch(console.error);
                    }
                    return;
                }
            }

            const targetUser = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(targetUser.id);

            // Check if the target user is manageable by the command user
            if (member && interaction.member.roles.highest.position <= member.roles.highest.position) {
                return await interaction.reply({
                    content: 'You cannot blacklist this user as they have the same or higher role than you!',
                    ephemeral: true
                });
            }

            if (subcommand === 'add') {
                let reason = interaction.options.getString('reason');
                const customReason = interaction.options.getString('custom_reason');

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

                try {
                    // Add user to blacklist
                    await addToBlacklist(
                        targetUser.id,
                        interaction.guild.id,
                        interaction.user.id,
                        reason
                    );

                    // Get or create System category
                    const systemCategory = await getOrCreateSystemCategory(interaction.guild);

                    // Get or create blacklisted channel
                    let blacklistedChannel = interaction.guild.channels.cache.find(
                        channel => channel.name === 'blacklisted' && channel.parentId === systemCategory.id
                    );

                    if (!blacklistedChannel) {
                        // Create the blacklisted channel in the System category
                        blacklistedChannel = await interaction.guild.channels.create({
                            name: 'blacklisted',
                            type: ChannelType.GuildText,
                            parent: systemCategory.id,
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.id, // @everyone role
                                    deny: [PermissionFlagsBits.ViewChannel]
                                },
                                {
                                    id: interaction.client.user.id, // Bot
                                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                                }
                            ],
                            topic: 'Channel for blacklisted users. You can read new messages but cannot send messages or view message history.'
                        });

                        // Send initial channel message
                        const initialEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Blacklisted Users Channel')
                            .setDescription('This channel is visible to blacklisted users. They can read new messages but cannot send messages or view message history.\n\nAll blacklist actions will be logged here.')
                            .setTimestamp();

                        await blacklistedChannel.send({ embeds: [initialEmbed] });
                    }

                    // Update member's permissions if they're in the server
                    if (member) {
                        // Get all channels except the blacklisted channel
                        const channels = interaction.guild.channels.cache.filter(channel => 
                            channel.type === ChannelType.GuildText &&
                            channel.id !== blacklistedChannel.id
                        );

                        // Update permissions for each channel
                        for (const [, channel] of channels) {
                            await channel.permissionOverwrites.create(targetUser.id, {
                                ViewChannel: false
                            });
                        }

                        // Set permissions for blacklisted channel
                        await blacklistedChannel.permissionOverwrites.create(targetUser.id, {
                            ViewChannel: true,
                            SendMessages: false,
                            ReadMessageHistory: false
                        });

                        // Send message in blacklisted channel
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('User Blacklisted')
                            .setDescription(`**User:** ${targetUser.tag}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`)
                            .setTimestamp();

                        await blacklistedChannel.send({ embeds: [embed] });
                    }

                    // Send confirmation message
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: `Successfully blacklisted ${targetUser.tag}.\nReason: ${reason}`,
                            ephemeral: true
                        });
                    }

                    // Try to DM the user about their blacklist
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle(`You have been blacklisted in ${interaction.guild.name}`)
                            .setDescription(`**Reason:** ${reason}\n\nYou can still view the #blacklisted channel but cannot send messages.`)
                            .setTimestamp();

                        await targetUser.send({ embeds: [dmEmbed] });
                    } catch (error) {
                        console.log(`Could not DM blacklist notification to ${targetUser.tag}`);
                    }
                } catch (error) {
                    console.error('Error in blacklist add command:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        if (error.message === 'User already blacklisted') {
                            await interaction.reply({
                                content: 'This user is already blacklisted!',
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                content: 'There was an error trying to blacklist that user!',
                                ephemeral: true
                            });
                        }
                    }
                }
            } else if (subcommand === 'remove') {
                try {
                    // Remove user from blacklist
                    await removeFromBlacklist(targetUser.id, interaction.guild.id);

                    // Update member's permissions if they're in the server
                    if (member) {
                        // Get all channels
                        const channels = interaction.guild.channels.cache.filter(channel => 
                            channel.type === ChannelType.GuildText
                        );

                        // Remove all permission overwrites for the user
                        for (const [, channel] of channels) {
                            await channel.permissionOverwrites.delete(targetUser.id).catch(console.error);
                        }

                        // Send message in blacklisted channel about removal
                        const systemCategory = await getOrCreateSystemCategory(interaction.guild);
                        const blacklistedChannel = interaction.guild.channels.cache.find(
                            channel => channel.name === 'blacklisted' && channel.parentId === systemCategory.id
                        );

                        if (blacklistedChannel) {
                            const embed = new EmbedBuilder()
                                .setColor('#00FF00')
                                .setTitle('User Removed from Blacklist')
                                .setDescription(`**User:** ${targetUser.tag}\n**Removed by:** ${interaction.user.tag}`)
                                .setTimestamp();

                            await blacklistedChannel.send({ embeds: [embed] }).catch(console.error);
                        }
                    }

                    // Send confirmation message
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: `Successfully removed ${targetUser.tag} from the blacklist.`,
                            ephemeral: true
                        });
                    }

                    // Try to DM the user about their blacklist removal
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle(`You have been removed from the blacklist in ${interaction.guild.name}`)
                            .setDescription('You now have normal access to the server channels.')
                            .setTimestamp();

                        await targetUser.send({ embeds: [dmEmbed] });
                    } catch (error) {
                        console.log(`Could not DM blacklist removal notification to ${targetUser.tag}`);
                    }
                } catch (error) {
                    console.error('Error in blacklist remove command:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        if (error.message === 'User not found in blacklist') {
                            await interaction.reply({
                                content: 'This user is not blacklisted!',
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                content: 'There was an error trying to remove that user from the blacklist!',
                                ephemeral: true
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in blacklist command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                }).catch(console.error);
            }
        }
    },
}; 