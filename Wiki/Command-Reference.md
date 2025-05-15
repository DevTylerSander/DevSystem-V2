# Command Reference

## Development
- `/development create {name} {type}`: Create a development environment (category, role, channels)
- `/development delete {name}`: Delete a development environment

## Moderation
- `/ban`, `/mute`, `/kick`, `/blacklist`, `/info`, `/purge`

## Changelog
- `/changelog {development}`: Create a changelog for a dev project (autocomplete from active dev categories)

## Tag System
- `/tag create {name} {message}`: Create a tag
- `/tag send {name}`: Send a tag message in the current channel (with autocomplete)
- `/tag edit {name} {message}`: Edit a tag (with autocomplete)
- `/tag delete {name}`: Delete a tag (with autocomplete)

## PayPal
- `/paypal setup {link}`: Set your PayPal.me link (developers only, per-user)
- `/paypal update {link}`: Update your PayPal.me link (developers only, per-user)
- `/paypal send`: Send your PayPal.me link as an embed with a button (developers only, per-user)

## Commission
- `/commission create`, `/commission delete`, `/commission close`, `/commission assign`, `/commission remove`

## ToS
- `/tos setup {channel} {role}`: Set up ToS embed and role
- `/tos update`: Update ToS message

## Customer
- `/customer create {user} {email} {product-name}`: Create customer channels
- `/customer invoice {user} {price} {description}`: Send invoice
- `/customer edit {user}`: Edit customer info
- `/customer delete {user}`: Delete customer

## Task
- `/task create {task} {description} (priority) (deadline)`
- `/task edit {task} {description} (priority) (deadline)`
- `/task complete {task} {Completed}`
- `/task delete {task}`
- `/task info {info}`
- `/task list`
- `/task list-global`

## Admin
- `/admin servers`, `/admin ban {server}`, `/admin unban {server}`
- `/admin join {server}`, `/admin message {server} {message}`
- `/admin update {message}`
- `/admin info {server}`
- `/admin setup {logs-channel}`
- `/admin logs`, `/admin analytics {command}`

## Utility
- `/format`, `/errorlogs`, `/help`, `/sticky`, `/purge`

### Utility Commands
- **/format**
  - _Description:_ Formats a message in code blocks.
  - _Example:_ `/format message:console.log('Hello!') language:javascript`

- **/purge {count}**
  - _Description:_ Deletes a specified number of messages.
  - _Example:_ `/purge count:10`

- **/sticky {message}**
  - _Description:_ Creates a sticky message that always stays at the bottom of the page.
  - _Example:_ `/sticky message:"Please read the rules!"`
  - _To remove sticky:_ `/sticky` (leave message blank)

- **/errorlogs {file}**
  - _Description:_ Upload an error log file (`.txt` only). The bot will post it in the channel.
  - _Example:_ `/errorlogs file:errors.txt`

### Moderation Commands
- **/ban {user} {reason}**
  - _Description:_ Ban a user from the server.
  - _Example:_ `/ban user:@troublemaker reason:Spamming`

- **/mute {user} {duration} {reason}**
  - _Description:_ Mute a user for a specified duration.
  - _Example:_ `/mute user:@noisy duration:30m reason:Spamming`

- **/kick {user} {reason}**
  - _Description:_ Kick a user from the server.
  - _Example:_ `/kick user:@rulebreaker reason:Inappropriate language`

- **/blacklist add {user}**
  - _Description:_ Blacklist a user (they only see the blacklisted channel).
  - _Example:_ `/blacklist add user:@spammer`
- **/blacklist remove {user}**
  - _Description:_ Remove a user from the blacklist.
  - _Example:_ `/blacklist remove user:@spammer`
- **/blacklist view**
  - _Description:_ View all blacklisted users in the server.
  - _Example:_ `/blacklist view`

- **/info {user}**
  - _Description:_ Get all relevant information about a user.
  - _Example:_ `/info user:@someone`

---
