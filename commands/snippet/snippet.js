const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { formatCode } = require('../../utils/codeFormatter');
const { Op } = require('sequelize');
const { createSnippet, getSnippet, updateSnippet, deleteSnippet, getAllSnippets } = require('../../utils/snippetStore');

// Helper function to extract code from a code block
function extractCodeFromBlock(text) {
    // Match code blocks with language specifier (```language\ncode\n```)
    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    
    if (match) {
        return {
            language: match[1] || 'plaintext',
            code: match[2]
        };
    }
    
    // If no code block, return the text as is
    return {
        language: 'plaintext',
        code: text
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snippet')
        .setDescription('Manage code snippets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new code snippet')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the snippet')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('The code snippet (use code blocks for multiline code)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('language')
                        .setDescription('Programming language of the snippet (if not specified in code block)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'JavaScript', value: 'javascript' },
                            { name: 'TypeScript', value: 'typescript' },
                            { name: 'Python', value: 'python' },
                            { name: 'Java', value: 'java' },
                            { name: 'C++', value: 'cpp' },
                            { name: 'C#', value: 'csharp' },
                            { name: 'PHP', value: 'php' },
                            { name: 'Ruby', value: 'ruby' },
                            { name: 'Go', value: 'go' },
                            { name: 'Rust', value: 'rust' },
                            { name: 'HTML', value: 'html' },
                            { name: 'CSS', value: 'css' },
                            { name: 'JSON', value: 'json' },
                            { name: 'YAML', value: 'yaml' },
                            { name: 'Markdown', value: 'markdown' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send a stored code snippet')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the snippet to send')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the snippet to')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing code snippet')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the snippet to edit')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('The new code snippet')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('language')
                        .setDescription('Programming language of the snippet')
                        .setRequired(false)
                        .addChoices(
                            { name: 'JavaScript', value: 'javascript' },
                            { name: 'TypeScript', value: 'typescript' },
                            { name: 'Python', value: 'python' },
                            { name: 'Java', value: 'java' },
                            { name: 'C++', value: 'cpp' },
                            { name: 'C#', value: 'csharp' },
                            { name: 'PHP', value: 'php' },
                            { name: 'Ruby', value: 'ruby' },
                            { name: 'Go', value: 'go' },
                            { name: 'Rust', value: 'rust' },
                            { name: 'HTML', value: 'html' },
                            { name: 'CSS', value: 'css' },
                            { name: 'JSON', value: 'json' },
                            { name: 'YAML', value: 'yaml' },
                            { name: 'Markdown', value: 'markdown' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a code snippet')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the snippet to delete')
                        .setRequired(true)
                        .setAutocomplete(true))),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const subcommand = interaction.options.getSubcommand();

        // Only handle autocomplete for the 'name' parameter
        if (focusedOption.name !== 'name') return;

        try {
            const searchTerm = focusedOption.value.toLowerCase();
            let snippets;

            if (subcommand === 'edit' || subcommand === 'delete') {
                // For edit and delete, only show snippets created by the user
                snippets = await getAllSnippets({ 
                    createdBy: interaction.user.id,
                    search: searchTerm
                });
            } else {
                // For send, show all snippets
                snippets = await getAllSnippets({ search: searchTerm });
            }

            const choices = snippets.slice(0, 25).map(snippet => ({
                name: `${snippet.name} (${snippet.language})`,
                value: snippet.name
            }));

            await interaction.respond(choices);
        } catch (error) {
            console.error('Error in snippet autocomplete:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');

        try {
            switch (subcommand) {
                case 'create': {
                    const codeInput = interaction.options.getString('code');
                    const specifiedLanguage = interaction.options.getString('language');
                    
                    // Extract code and language from code block if present
                    const { code, language: blockLanguage } = extractCodeFromBlock(codeInput);
                    const language = specifiedLanguage || blockLanguage;
                    
                    // Format the code while preserving whitespace
                    const formattedCode = await formatCode(code, language);
                    
                    // DEBUG: Log the formatted code to ensure it contains newlines
                    // console.log('Formatted code to save:', JSON.stringify(formattedCode));
                    
                    // Always split on /\r?\n/ to handle all newline types
                    const codeLines = formattedCode.split(/\r?\n/);
                    
                    // Create the snippet
                    await createSnippet(name, codeLines, language, interaction.user.id);

                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Snippet Created')
                        .setDescription(`Successfully created snippet "${name}"`)
                        .addFields(
                            { name: 'Language', value: language, inline: true },
                            { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true }
                        );

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'send': {
                    const snippet = await getSnippet(name);
                    if (!snippet) {
                        return interaction.reply({ 
                            content: `Snippet "${name}" not found.`,
                            ephemeral: true 
                        });
                    }

                    const channel = interaction.options.getChannel('channel') || interaction.channel;
                    
                    // Join lines for display
                    const codeString = Array.isArray(snippet.content) ? snippet.content.join('\n') : snippet.content;
                    
                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`Snippet: ${name}`)
                        .setDescription(`\`\`\`${snippet.language}\n${codeString}\n\`\`\``)
                        .addFields(
                            { name: 'Language', value: snippet.language, inline: true },
                            { name: 'Created By', value: `<@${snippet.createdBy}>`, inline: true },
                            { name: 'Created At', value: new Date(snippet.createdAt).toLocaleString(), inline: true }
                        );

                    await channel.send({ embeds: [embed] });
                    await interaction.reply({ 
                        content: `Snippet sent to ${channel}`,
                        ephemeral: true 
                    });
                    break;
                }

                case 'edit': {
                    const snippet = await getSnippet(name);
                    if (!snippet) {
                        return interaction.reply({ 
                            content: `Snippet "${name}" not found.`,
                            ephemeral: true 
                        });
                    }

                    // Check if user is the creator
                    if (snippet.createdBy !== interaction.user.id) {
                        return interaction.reply({ 
                            content: 'You can only edit your own snippets.',
                            ephemeral: true 
                        });
                    }

                    const codeInput = interaction.options.getString('code');
                    const specifiedLanguage = interaction.options.getString('language');
                    
                    // Extract code and language from code block if present
                    const { code, language: blockLanguage } = extractCodeFromBlock(codeInput);
                    const language = specifiedLanguage || blockLanguage || snippet.language;
                    
                    // Format the code while preserving whitespace
                    const formattedCode = await formatCode(code, language);
                    
                    // DEBUG: Log the formatted code to ensure it contains newlines
                    // console.log('Formatted code to update:', JSON.stringify(formattedCode));
                    
                    // Always split on /\r?\n/ to handle all newline types
                    const codeLines = formattedCode.split(/\r?\n/);
                    
                    // Update the snippet
                    await updateSnippet(name, codeLines, language);

                    const embed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('Snippet Updated')
                        .setDescription(`Successfully updated snippet "${name}"`)
                        .addFields(
                            { name: 'Language', value: language, inline: true },
                            { name: 'Updated By', value: `<@${interaction.user.id}>`, inline: true }
                        );

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'delete': {
                    const snippet = await getSnippet(name);
                    if (!snippet) {
                        return interaction.reply({ 
                            content: `Snippet "${name}" not found.`,
                            ephemeral: true 
                        });
                    }

                    // Check if user is the creator
                    if (snippet.createdBy !== interaction.user.id) {
                        return interaction.reply({ 
                            content: 'You can only delete your own snippets.',
                            ephemeral: true 
                        });
                    }

                    await deleteSnippet(name);

                    const embed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('Snippet Deleted')
                        .setDescription(`Successfully deleted snippet "${name}"`)
                        .addFields(
                            { name: 'Deleted By', value: `<@${interaction.user.id}>`, inline: true }
                        );

                    await interaction.reply({ embeds: [embed] });
                    break;
                }
            }
        } catch (error) {
            console.error('Error in snippet command:', error);
            await interaction.reply({ 
                content: error.message || 'An error occurred while processing your request.',
                ephemeral: true 
            });
        }
    },
}; 