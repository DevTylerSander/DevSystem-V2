const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sequelize, dbEvents } = require('./config/database');
const { getSticky, setLastStickyMessageId } = require('./utils/stickyStore');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Listen for database events
dbEvents.on('connected', (message) => {
    console.log(`[Database] ${message}`);
});

dbEvents.on('error', (message) => {
    console.error(`[Database] ${message}`);
});

// Create collections for commands
client.commands = new Collection();

// Recursive function to walk through all subdirectories and collect .js files
const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of list) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.isFile() && file.name.endsWith('.js')) {
            results.push(filePath);
        }
    }
    return results;
};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = walk(commandsPath);
console.log(`[Commands] Found ${commandFiles.length} command files in commands directory and subdirectories`);

const commands = [];

for (const filePath of commandFiles) {
    try {
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`[Commands] Successfully loaded command: ${command.data.name} from ${filePath.replace(__dirname, '')}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to load command from ${filePath}:`, error);
    }
}

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // Register slash commands
    try {
        console.log('Started refreshing application (/) commands...');
        
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        // The put method is used to fully refresh all commands
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully registered ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Handle autocomplete interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isAutocomplete()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.autocomplete(interaction);
    } catch (error) {
        console.error(error);
    }
});

// Sticky message handler
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check for sticky in this channel
    const sticky = await getSticky(message.channel.id);
    if (!sticky) return;

    // Delete the previous sticky message if it exists
    if (sticky.lastMessageId) {
        try {
            const prevMsg = await message.channel.messages.fetch(sticky.lastMessageId);
            if (prevMsg && prevMsg.deletable) {
                await prevMsg.delete();
            }
        } catch (err) {
            // Ignore if message not found or can't delete
        }
    }

    // Send the sticky message as an embed
    const embed = new EmbedBuilder()
        .setTitle('Sticky Message')
        .setDescription(sticky.message)
        .setColor('#FFD700');
    const sent = await message.channel.send({ embeds: [embed] });
    await setLastStickyMessageId(message.channel.id, sent.id);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
