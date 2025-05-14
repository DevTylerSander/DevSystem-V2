const { SlashCommandBuilder } = require('discord.js');
const hljs = require('highlight.js');
const prettier = require('prettier');
const beautify = require('js-beautify').js;

// Regex patterns for comments
const commentPatterns = [
    /\/\/.*$/gm, // Single-line comments (//)
    /#.*$/gm,    // Python/bash single-line comments (#)
    /\/\*[\s\S]*?\*\//gm // Multi-line comments (/* */)
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('format')
        .setDescription('Formats a message in code blocks')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to format')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('language')
                .setDescription('The programming language for syntax highlighting')
                .setRequired(false)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = [
            'javascript', 'typescript', 'python', 'java', 'csharp',
            'cpp', 'c', 'php', 'ruby', 'swift', 'kotlin', 'rust',
            'go', 'html', 'css', 'sql', 'json', 'xml', 'yaml',
            'markdown', 'bash', 'shell', 'plaintext', 'node', 'nodejs'
        ];
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25)
        );
    },

    async execute(interaction) {
        let message = interaction.options.getString('message');
        let language = interaction.options.getString('language');

        // Check for comments in the code
        for (const pattern of commentPatterns) {
            if (pattern.test(message)) {
                return interaction.reply({
                    content: 'Please remove all comments from your code and resend it. Comments cant be formatted.',
                    ephemeral: true
                });
            }
        }

        // Auto-detect language if not specified
        if (!language) {
            const detected = hljs.highlightAuto(message);
            language = detected.language || 'plaintext';
        }

        let formatted = message;
        try {
            if ([
                'javascript', 'typescript', 'node', 'nodejs'
            ].includes(language)) {
                formatted = beautify(message, { indent_size: 2, brace_style: 'collapse' });
            } else if (['json', 'html', 'css'].includes(language)) {
                formatted = prettier.format(message, { parser: language });
            } else if (['python'].includes(language)) {
                formatted = beautify(message, { indent_size: 4, brace_style: 'collapse' });
            }
        } catch (err) {
            console.error('Formatting error:', err.message);
            formatted = message;
        }

        const formattedMessage = `\`\`\`${language}\n${formatted}\n\`\`\``;

        if (formattedMessage.length > 2000) {
            return interaction.reply({
                content: 'Error: The formatted message is too long. Discord has a 2000 character limit.',
                ephemeral: true
            });
        }

        await interaction.reply(formattedMessage);
    },
}; 