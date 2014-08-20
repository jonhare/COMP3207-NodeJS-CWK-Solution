#COMP3207 Coursework 1

	███████╗ ██████╗███████╗      ███╗   ███╗██╗   ██╗██████╗            
	██╔════╝██╔════╝██╔════╝      ████╗ ████║██║   ██║██╔══██╗           
	█████╗  ██║     ███████╗█████╗██╔████╔██║██║   ██║██║  ██║           
	██╔══╝  ██║     ╚════██║╚════╝██║╚██╔╝██║██║   ██║██║  ██║           
	███████╗╚██████╗███████║      ██║ ╚═╝ ██║╚██████╔╝██████╔╝           
	╚══════╝ ╚═════╝╚══════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═════╝            


##Introduction
A MUD (*Multi-User Dungeon*) is a multi-user virtual world described entirely by text. MUDs combine elements of role-playing games, interactive fiction and online chat. Originally, MUDs were connected to over the internet via the telnet protocol (try telnetting to PennMUSH (a MUSH a variant of a MUD and stands for `Multi-User Shared Hallucination`) by clicking [here](telnet://mush.pennmush.org:4201) or typing `telnet mush.pennmush.org 4201` in a terminal). MUDs were extremely popular with undergraduate students of the late 80's and during this time it was sometimes said that the MUD acroynm stood for "Multiple Undergraduate Destroyer" sue to their popularity amongst students and the amount of time devoted to them.
	                                                                    
In this coursework you are going to build a MUD engine called `ECS-MUD` using [nodejs](http://www.nodejs.org) server-side javascript and deploy it in the cloud using the [Heroku](http://www.heroku.com) platform. Rather than using telnet as the communication protocol, ECS-MUD will communicate with clients using the new HTLM5 [WebSockets](https://www.websocket.org). Rather than starting from scratch, we have provided a basic MUD implementation to get you started, and you will need to create a number of additional features to complete the implementation.


##Effort
This coursework is worth 33% of the overall mark for the COMP3207 module; this equates to just over 40 hours of work.

##Getting started
1. Check that you have a copy of `COMP3207-CW1-1415` in you github repository. If you don't then email or speak to Jon immediately.
2. Login in to [Heroku](http://www.heroku.com) (create a free account if you don't already have one) and create a new application called `COMP3207CW1-<your ECS user id>`.
3. Provision a free Heroku `postgresql` database for your newly created app.
4. Download/install [node](http://nodejs.org/download/) and [Heroku toolbelt](http://toolbelt.heroku.com/)
	* These do not necessarily need to be installed - there are straight binary packages that you can unpack and put in your filespace if you're using university/ECS machines.
	* If you download the binary version of node without the installer, you'll also need to download [npm](https://www.npmjs.org/doc/README.html).
	* If you are using the binary versions, you'll need to setup your `PATH` so that the `node`, `npm` and `heroku` tools can be accessed from the command-line.
5. Clone your `COMP3207-CW1-1415` repository and edit the `package.json` file to fill in your details.
6. Edit the `models/index.js` file so that it points at the database instance you provisioned.
7. Follow the instructions in the [Heroku dev center](https://devcenter.heroku.com/articles/git) to deploy the skeleton application (skip down to the bit about using an existing git repo ('You can also take an existing Git repo...').
8. Go to `http://COMP3207CW1-<your ECS user id>.herokuapp.com` and test the application is working.

##

##Requirements

##Deliverables

1. A working version of the MUD, deployed on the Heroku cloud platform
2. A short (maximum of 2 A4 sides) report including the following:
	* Your name, a link to your heroku app instance and your Github repository.
	* An entity-relationship diagram showing the structure of the database used in the MUD.
	* A description of any problems or challenges you encountered implementing the requirements.
	* Details of how you performed testing of the application.
3. The source-code to the MUD, in your COMP3207 Github repository and with a snapshot uploaded to handin with the report PDF.

##Checklist