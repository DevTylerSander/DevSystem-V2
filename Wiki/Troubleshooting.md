# Troubleshooting

## PayPal Developer Access
- If you get a message saying you are not a registered developer, make sure your user ID is listed in `data/developers.json`.
- Only users in this file can use `/paypal setup`, `/paypal update`, or `/paypal send`.

## Tag/Changelog Autocomplete
- If autocomplete is not working, make sure the relevant data files (`tags.json`, `development_categories.json`) exist and are not empty/corrupt.
- Restart the bot after making changes to data files or commands.

## General
- Check bot permissions in Discord.
- Review logs for errors.
- See the README and Wiki for more help.
