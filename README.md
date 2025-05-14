# DevSystem-V2 Discord Bot

A powerful Discord moderation and utility bot with persistent data and advanced features.

## Completed Commands

### Utility Commands
- **/format**
  - Formats a message in code blocks
  - _Location: `commands/utilitys/format.js`_

- **/purge {count}**
  - Deletes a specified number of messages
  - _Location: `commands/utilitys/purge.js`_

- **/sticky {message}**
  - Creates a message that always stays at the bottom of the page
  - _Location: `commands/utilitys/sticky.js`_

- **/errorlogs {file}**
  - Allows users to send error logs (only allows `.txt` files)
  - _Location: `commands/utilitys/errorlogs.js`_

### Moderation Commands
- **/ban {user} {reason}**
  - Bans a user from the Discord server
  - _Location: `commands/moderation/ban.js`_

- **/mute {user} {duration} {reason}**
  - Mutes a user for a certain time
  - _Location: `commands/moderation/mute.js`_

- **/kick {user} {reason}**
  - Kicks a user with a reason
  - _Location: `commands/moderation/kick.js`_

- **/blacklist add {user}**
  - Blacklists a user and only lets them see a blacklisted channel (persists even if they leave and rejoin)
  - _Location: `commands/moderation/blacklist.js`_
- **/blacklist remove {user}**
  - Removes a user from the blacklist
  - _Location: `commands/moderation/blacklist.js`_
- **/blacklist view**
  - Lists all blacklisted users
  - _Location: `commands/moderation/blacklist.js`_

- **/info {user}**
  - Gets all information about a user
  - _Location: `commands/moderation/info.js`_

---

## Features
- Persistent data for blacklists, sticky messages, and moderation stats
- Modern slash command interface
- Permission checks for all moderation actions
- Easy to extend and customize

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure your `.env` file with your Discord bot token and client ID
4. Start the bot: `npm start`

## Folder Structure
- `commands/utilitys/` — Utility commands
- `commands/moderation/` — Moderation commands
- `utils/` — Persistent storage utilities
- `data/` — Persistent JSON data files

---

## Contributing
Pull requests and suggestions are welcome!

## License
MIT 