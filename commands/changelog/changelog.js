const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/development_categories.json');

function loadCategories() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return [];
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changelog')
        .setDescription('Create a changelog entry with different sections')
        .addStringOption(option =>
            option.setName('development')
                .setDescription('The development name this changelog is for')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const categories = loadCategories();
        const filtered = categories.filter(name =>
            name.toLowerCase().includes(focusedValue.toLowerCase())
        ).map(name => ({ name, value: name }));
        try {
            await interaction.respond(filtered.slice(0, 25));
        } catch (err) {
            console.error('Autocomplete respond error:', err);
        }
    },

    async execute(interaction) {
        const devName = interaction.options.getString('development');
        const guild = interaction.guild;

        // Find the development category
        const devCategory = guild.channels.cache.find(channel =>
            channel.type === ChannelType.GuildCategory &&
            channel.name === devName
        );

        if (!devCategory) {
            return interaction.reply({
                content: 'Could not find the selected development category.',
                ephemeral: true
            });
        }

        // Find the announcement channel under the development category
        const announcementChannel = devCategory.children.cache.find(channel =>
            channel.type === ChannelType.GuildAnnouncement
        );

        if (!announcementChannel) {
            return interaction.reply({
                content: 'Could not find an announcement channel for this development project.',
                ephemeral: true
            });
        }

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('changelogModal')
            .setTitle(`Create Changelog Entry for ${devName}`);

        // Create text inputs for each section
        const addedInput = new TextInputBuilder()
            .setCustomId('added')
            .setLabel('[+] Added')
            .setPlaceholder('Enter items that were added (one per line)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const improvedInput = new TextInputBuilder()
            .setCustomId('improved')
            .setLabel('[*] Improved')
            .setPlaceholder('Enter items that were improved (one per line)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const changedInput = new TextInputBuilder()
            .setCustomId('changed')
            .setLabel('[/] Changed')
            .setPlaceholder('Enter items that were changed (one per line)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const fixedInput = new TextInputBuilder()
            .setCustomId('fixed')
            .setLabel('[!] Fixed')
            .setPlaceholder('Enter items that were fixed (one per line)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        const deletedInput = new TextInputBuilder()
            .setCustomId('deleted')
            .setLabel('[-] Deleted')
            .setPlaceholder('Enter items that were deleted (one per line)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        // Add inputs to action rows
        const firstRow = new ActionRowBuilder().addComponents(addedInput);
        const secondRow = new ActionRowBuilder().addComponents(improvedInput);
        const thirdRow = new ActionRowBuilder().addComponents(changedInput);
        const fourthRow = new ActionRowBuilder().addComponents(fixedInput);
        const fifthRow = new ActionRowBuilder().addComponents(deletedInput);

        // Add action rows to modal
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);

        // Show the modal to the user
        await interaction.showModal(modal);

        // Wait for the modal submission
        const filter = i => i.customId === 'changelogModal';
        try {
            const submission = await interaction.awaitModalSubmit({ filter, time: 300000 }); // 5 minute timeout

            // Get the values from the modal
            const added = submission.fields.getTextInputValue('added');
            const improved = submission.fields.getTextInputValue('improved');
            const changed = submission.fields.getTextInputValue('changed');
            const fixed = submission.fields.getTextInputValue('fixed');
            const deleted = submission.fields.getTextInputValue('deleted');

            // Format the changelog content
            let changelogContent = '';
            
            if (added) {
                const addedLines = added.split('\n').filter(line => line.trim());
                addedLines.forEach(line => {
                    changelogContent += `[+] Added ${line}\n`;
                });
            }
            
            if (improved) {
                const improvedLines = improved.split('\n').filter(line => line.trim());
                improvedLines.forEach(line => {
                    changelogContent += `[*] Improved ${line}\n`;
                });
            }
            
            if (changed) {
                const changedLines = changed.split('\n').filter(line => line.trim());
                changedLines.forEach(line => {
                    changelogContent += `[/] Changed ${line}\n`;
                });
            }
            
            if (fixed) {
                const fixedLines = fixed.split('\n').filter(line => line.trim());
                fixedLines.forEach(line => {
                    changelogContent += `[!] Fixed ${line}\n`;
                });
            }
            
            if (deleted) {
                const deletedLines = deleted.split('\n').filter(line => line.trim());
                deletedLines.forEach(line => {
                    changelogContent += `[-] Deleted ${line}\n`;
                });
            }

            // Create and send the embed
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`📝 Changelog - ${devName}`)
                .setDescription(`\`\`\`\n${changelogContent}\`\`\``)
                .setTimestamp()
                .setFooter({ text: `Changelog created by ${interaction.user.tag}` });

            // Send to the development's announcement channel
            await announcementChannel.send({ embeds: [embed] });
            
            // Confirm to the user
            await submission.reply({ 
                content: `Changelog has been posted to ${announcementChannel}`, 
                ephemeral: true 
            });

        } catch (error) {
            if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
                await interaction.followUp({ content: 'Changelog creation timed out. Please try again.', ephemeral: true });
            } else {
                console.error(error);
                await interaction.followUp({ content: 'There was an error while creating the changelog.', ephemeral: true });
            }
        }
    },
}; 