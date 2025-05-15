# Getting Started

Welcome to DevSystem-V2! This guide will help you set up and use the bot.

## Setup
1. Clone the repository and install dependencies.
2. Configure your `.env` file with your Discord bot token and client ID.
3. Start the bot with `node bot.js`.
4. The bot will auto-register all slash commands.

## Data Storage
- All persistent data is stored in the `data/` directory as JSON files.
- Developers are listed in `data/developers.json` and only they can use certain commands (like PayPal).

## Features
- Per-developer PayPal links (only developers can set/send)
- Tag system with autocomplete
- Changelog system with project autocomplete

See the Command Reference for all commands.