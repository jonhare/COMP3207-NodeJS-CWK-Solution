/**
 * scripts/strings.js
 * 
 * Strings for communicating with a player. 
 * 
 * Note that some strings may be parsed by the string library 
 * (http://stringjs.com/#methods/template-values-open-close) to 
 * perform templating, and hence the `{{...}}` constructs.
 *
 * @author Jonathon Hare (jsh2@ecs.soton.ac.uk)
 */
module.exports = {
	loginPrompt:  
				"                                                                                \n" + 
				"Welcome to ECS-MUD!                                                             \n" + 
				"                                                                                \n" + 
				"================================================================================\n" +
				"                                                                                \n" +
				"           ███████╗ ██████╗███████╗      ███╗   ███╗██╗   ██╗██████╗            \n" +
				"           ██╔════╝██╔════╝██╔════╝      ████╗ ████║██║   ██║██╔══██╗           \n" +
				"           █████╗  ██║     ███████╗█████╗██╔████╔██║██║   ██║██║  ██║           \n" +
				"           ██╔══╝  ██║     ╚════██║╚════╝██║╚██╔╝██║██║   ██║██║  ██║           \n" +
				"           ███████╗╚██████╗███████║      ██║ ╚═╝ ██║╚██████╔╝██████╔╝           \n" +
				"           ╚══════╝ ╚═════╝╚══════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═════╝            \n" +
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
	enters: 			"{{name}} has entered the room",

	// Default data for the first room
	defaultRoomName: 	"Starting room",
	defaultRoomDescription: "You are standing in a fabulous, "
				+ "fabulous, exotic room, with all sorts of things that go 'hum' "
				+ "and 'plink' in the night.\n\nAs you glance around the room, "
				+ "you wonder what else might exist in this world.",
};
