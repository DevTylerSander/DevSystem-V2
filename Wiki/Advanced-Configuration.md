# Advanced Configuration

- You can manually edit files in the `data/` directory for advanced setup.
- To add or remove developers for PayPal and other developer-only features, edit `data/developers.json`.
- For custom workflows, see the Command Reference and Persistent Data pages.

- **Customizing sticky message embeds:**
  - You can edit the code in `commands/utilitys/sticky.js` and the sticky handler in `bot.js` to change the embed color, title, or add more fields.
- **Changing the blacklisted channel/category name:**
  - Edit the logic in `commands/moderation/blacklist.js` to use a different name or category for blacklisted users.
- **Adding new commands:**
  - Place new command files in the appropriate subdirectory under `commands/` and restart the bot.
