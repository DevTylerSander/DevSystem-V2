const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/paypal.json');
const DEV_FILE = path.join(__dirname, '../../data/developers.json');

function loadPaypal() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
        return {}; // { userId: link }
    }
}

function savePaypal(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function isDeveloper(userId) {
    try {
        const devs = JSON.parse(fs.readFileSync(DEV_FILE, 'utf8'));
        return Object.prototype.hasOwnProperty.call(devs, userId);
    } catch {
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paypal')
        .setDescription('Manage and send your PayPal.me link')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set your PayPal.me link')
                .addStringOption(option =>
                    option.setName('link')
                        .setDescription('Your PayPal.me link')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('send')
                .setDescription('Send your PayPal.me link as an embed with a button'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update your PayPal.me link')
                .addStringOption(option =>
                    option.setName('link')
                        .setDescription('Your new PayPal.me link')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const paypalData = loadPaypal();
        const userId = interaction.user.id;

        if (!isDeveloper(userId)) {
            return await interaction.reply({ content: 'Only registered developers can use this command.', ephemeral: true });
        }

        if (subcommand === 'setup' || subcommand === 'update') {
            const link = interaction.options.getString('link');
            paypalData[userId] = link;
            savePaypal(paypalData);
            await interaction.reply({ content: `Your PayPal.me link has been ${subcommand === 'setup' ? 'set' : 'updated'} successfully!`, ephemeral: true });
        }
        else if (subcommand === 'send') {
            const link = paypalData[userId];
            if (!link) {
                return await interaction.reply({ content: 'You have not set a PayPal.me link yet. Use `/paypal setup` to set your link.', ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle('PayPal Payment')
                .setDescription('Click the button below to pay via PayPal.')
                .setColor(0x0099FF);
            const button = new ButtonBuilder()
                .setLabel('PayPal.me')
                .setStyle(ButtonStyle.Link)
                .setURL(link);
            const row = new ActionRowBuilder().addComponents(button);
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    },
}; 