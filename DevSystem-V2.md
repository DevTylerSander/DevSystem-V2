DevSystem-V2
All commands should have auto complete information and data should be persistent

-Compleated Commands-
/Format - Formats a message in code blocks (This command goes in /utilitys folder)

/purge {count} - deletes messages (This command goes in /utilitys folder)

/ban {user}{reason} - this will ban a user from the discord server (This command goes in /commands/moderation folder)

/mute {user}{duration}{reason} -this will mute a user for a certain time (This command goes in /commands/moderation folder)

/kick {user}{reason} - this will kick a user with a reason (This command goes in/commands /moderation folder)

/blacklist  (This command goes in  /commands/commands/moderation folder)
	-add {user} - this will blacklist a user and only let the user see a blacklisted channel this should persist even when they leaves the server and joins back
	-remove {user} - this will remove a user from the blacklist
	-view - lists all blacklisted users

/info {user} - will get all information about a user (This command goes in /commands/moderation folder)

/sticky {message} - this will create a message that always stays at the bottom of the page (This command goes in /commands/utilitys folder)

/errorlogs {file} - this will allows user to send error logs (only allows .txt files) (This command goes in /commands/utilitys folder)


-Simple Commands-
/help {command} - gives information on a command (This command goes in /utilitys folder)

-Complex Commands-
/Development (This command goes in /commands/development folder)
	-Create {name}{type} - creates new channels and role for testing new bots
		-{types} (Text, Voice, Forum, Announcement)
		-{name} (this will be the name of the category)
	-delete {name} - deletes channels for testing bots

/dev (This command goes in  /commands/dev folder)
	-add {user} - gives a user the developer role
	-remove {user} - removes the developer role from user
	-info {user} - gives information about the developer
	-update {user} - updates users information

/commission (only allows users to create a ticket if they have accepted the tos) (This command goes in  /commands/commission folder)
	-create - this creates a commission ticket
	-delete - this deletes a commission ticket
	-close	- this closes a commission ticket
	-assign - this will assign a developer to a commission
	-remove - this will remove a developer from a commission

/embed (This command goes in  /commands/embed folder)
	-create {name} - this will open a menu and ask for a all information regarding a embed and store these in a database
	-send {name}{channel} - this allows user to send a stored embed in a channel
	-edit {name} - this allows a user to edit a stored embed
	-delete {name} - this allows a user to delete a stored embed

/snippet (This command goes in  /commands/snippet folder)
	-create {name} - this allows a user to crate a code snippet and be stored to a database for later use (should auto format the code)
	-send {name}{channel} - this allows a user to send a store code snippet
	-edit {name} - this allows a user to edit a stored snippet
	-delete {name} - this allows a user to delete a stored snippet from the database

/tag (This command goes in  /commands/tag folder)
	-create {name}{message} - creates quick messages that is stored in a database and can be sent by any user
	-send {channel} - sends a quick message to a channel
	-edit {name} - edits a quick message that has been stored in a database
	-delete {name} - deletes a quick message that was stored in a database

/changelog - opens a menu with 5 sections ([+] Added, [*] Improved, [/] Changed, [!] Fixed, [-] Deleted) (This command goes in  /commands/changelog folder)
	- when the user is done they will click submit
	- then it will send the changelog in the channel the command was issued in
	- the text the user entered will be in a embed in code block format
	- and in the code block it will be formatted like this
		[+] Added {message}
		[*] Improved {message}
		[/] Changed {message}
		[!] Fixed {message}
		[-] Deleted {message}
	-if the user has added multiple lines for a section it will add another line

/tos (This command goes in  /commands/tos folder)
	-setup {channel}{role} - opens a menu so a user can set the message for the embed message and adds a accept button to the embed if a user accepts the embed they get the role 
	-update - opens the menu to edit the tos message

/paypal (This command goes in  /commands/paypal folder)
	-setup {link} - sets the paypal.me link
	-send - sends a embed message with a button link
	-update {link} - updates the paypal.me link
/customer (This command goes in  /commands/customer folder)
	-create {user}{email}{product-name} - this will create the customer their own channel for them to get support.
		-Channels needed (Text, Voice, Announcement)
		-Category name will be the display name for the user
		-For the announcement channel it should send an initial message pinging the user thanking them/ welcoming them.
	-invoice {user} {price} {description}- sends a user a invoice for their product
	-edit {user} - this allows for editing the customers information
	-delete {user} - this deletes the customer from the database and remove their channels

/task (tasks should only be created in the customers text channel) (This command goes in  /commands/task folder)
	-create {task}{description}(priority)(deadline) - allows all users to create a new task
	-edit {task}{description}(priority)(deadline) - allows user to edit their tasks
	-complete {task}{Completed} - allows devs to update the task with "Completed"
	-delete {task} - allows dev to remove tasks
	-info {info} - allows all customers to get info on their tasks
	-list - allows users to view all tasks they created
	-list-global - allows admins to view all tasks created

/admin (this command should only be for the developer of the discord bot) (This command goes in  /commands/admin folder)
	-servers - this will list all servers with the discord bot added
	-ban {server} - this should ban a server from inviting the discord bot and should kick the bot if its in the server
	-unban {server} - this should unban a server and let them invite the bot back
	-join {server} - this should give me a invite for the server that is selected
	-message {server}{message} - this should send a embed message to the discord server owner 
	-update {message} - this should send a embed message to the discord server owner to all servers that have the bot in the discord server
	-info {server} - this should send detailed information in a embed message of the server (like user count, total channels, total bots, server owner(name and id), ect.)
	-setup {logs-channel}
	-logs - this should send detailed command logs to a channel that is setup in the /admin setup command
	-analytics {command} - monitor command usage and engagement statistics










