module.exports = {
	loginPrompt:  
				"                                                                                \n" + 
				"Welcome to NanoMUD-WS!                                                          \n" + 
				"                                                                                \n" + 
				"================================================================================\n" +
				"                                                                                \n" +
				"                                                                                \n" + 
				"      _   _                   __  __ _    _ _____      __          _______      \n" +
 				"     | \\ | |                 |  \\/  | |  | |  __ \\     \\ \\        / / ____|\n" +
 				"     |  \\| | __ _ _ __   ___ | \\  / | |  | | |  | |_____\\ \\  /\\  / / (___  \n" +
 				"     | . ` |/ _` | '_ \\ / _ \\| |\\/| | |  | | |  | |______\\ \\/  \\/ / \\___ \\\n" +
 				"     | |\\  | (_| | | | | (_) | |  | | |__| | |__| |       \\  /\\  /  ____) |  \n" +
 				"     |_| \\_|\\__,_|_| |_|\\___/|_|  |_|\\____/|_____/         \\/  \\/  |_____/\n" +
				"                                                                                \n" + 
				"                                                                                \n" +
				"                                                                                \n" + 
				"================================================================================\n" +
				"Use create <name> <password> to create a character.                             \n" + 
				"Use connect <name> <password> to create a character.                            \n" + 
				"Use QUIT to logout.                                                             \n" + 
				"Use the WHO command to find out who is online currently.                        \n" + 
				"================================================================================\n" +
				"                                                                                \n",
	alreadyLoggedIn:	"You are aready logged in.",
	unknownCommand:		"Huh?",
	badUsername: 		"Bad username.",
	usernameInUse: 		"There is already a player with that name.",
	badPassword: 		"Bad password.",
	incorrectPassword: 	"That is not the correct password.", 
	playerNotFound:		"There is no player with that name.", 
	hasConnected: 		"{{name}} has connected.", 
	hasDisconnected: 	"{{name}} has disconnected.", 
	youSay: 			"You say \"{{message}}\"",
	says: 				"{{name}} says \"{{message}}\"", 
	invalidName: 		"Invalid name.", 
	roomCreated: 		"Room \"{{name}}\" created with ID: {{id}}.",
	youWhisper: 		"You whisper \"{{message}}\" to {{name}}.",
	toWhisper: 			"{{name}} whispers \"{{message}}\" to you.",
	whisper: 			"{{fromName}} whispers something to {{toName}}", 
	overheard: 			"You overheard {{fromName}} whisper \"{{message}}\" to {{toName}}", 
	notInRoom: 			"{{name}} is not in the room.",
	dontSeeThat: 		"You can't see {{name}} here.",
	peopleHere: 		"People here:",
	youSee:  			"You see:",
};