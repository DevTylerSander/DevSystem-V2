# DevSystem-V2

A Discord bot for managing development, moderation, commissions, tags, changelogs, and more, with persistent data and advanced features.

## Features
- **Development Management**: Create/delete development categories, roles, and channels.
- **Moderation**: Ban, mute, kick, blacklist, and info commands.
- **Sticky Messages**: Persistent messages in channels.
- **Changelog**: Create changelogs for development projects, sent to announcement channels.
- **Tag System**: Create, send, edit, and delete quick message tags with autocomplete.
- **Commission System**: Ticketing and assignment for commissions.
- **ToS System**: Terms of service with role assignment.
- **PayPal Integration**: Each developer can set, update, and send their own PayPal.me link (restricted to registered developers).
- **Customer Management**: Create customer channels, send invoices, and manage customer data.
- **Task Management**: Create, edit, complete, and list tasks for customers and admins.
- **Admin Tools**: Server management, analytics, logs, and more.

## Command Reference
See the Wiki for full details. Highlights:

### Development
- `/development create {name} {type}`: Create a dev environment (category, role, channels)
- `/development delete {name}`: Delete a dev environment

### Moderation
- `/ban`, `/mute`, `/kick`, `/blacklist`, `/info`, `/purge`

### Changelog
- `/changelog {development}`: Create a changelog for a dev project (autocomplete from active dev categories)

### Tag System
- `/tag create {name} {message}`
- `/tag send {name}`
- `/tag edit {name} {message}`
- `/tag delete {name}`

### PayPal
- `/paypal setup {link}`: Set your PayPal.me link (developers only)
- `/paypal update {link}`: Update your PayPal.me link (developers only)
- `/paypal send`: Send your PayPal.me link as an embed with a button (developers only)

### More
- `/embed`, `/snippet`, `/commission`, `/tos`, `/customer`, `/task`, `/admin` and more.

## Persistent Data
- All data is stored in the `data/` directory as JSON files for tags, developers, PayPal links, etc.

## Permissions
- Some commands are restricted to developers (as listed in `data/developers.json`) or admins.

## Getting Started
See the Wiki for setup, configuration, and troubleshooting.

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