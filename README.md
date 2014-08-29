#COMP3207 Coursework 1

	███████╗ ██████╗███████╗      ███╗   ███╗██╗   ██╗██████╗            
	██╔════╝██╔════╝██╔════╝      ████╗ ████║██║   ██║██╔══██╗           
	█████╗  ██║     ███████╗█████╗██╔████╔██║██║   ██║██║  ██║           
	██╔══╝  ██║     ╚════██║╚════╝██║╚██╔╝██║██║   ██║██║  ██║           
	███████╗╚██████╗███████║      ██║ ╚═╝ ██║╚██████╔╝██████╔╝           
	╚══════╝ ╚═════╝╚══════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═════╝            

**The de-facto version of these instructions is available at [https://github.com/COMP3207-TESTING/CW1](https://github.com/COMP3207-TESTING/CW1).**

##Introduction
A MUD (*Multi-User Dungeon*) is a multi-user virtual world described entirely by text. MUDs combine elements of role-playing games, interactive fiction and online chat. Originally, MUDs were connected to over the internet via the telnet protocol (try telnetting to PennMUSH (a MUSH is a variant of a MUD and stands for *Multi-User Shared Hallucination*) by typing `telnet mush.pennmush.org 4201` in a terminal). MUDs were extremely popular with undergraduate students of the late 80's and during this time it was sometimes said that the MUD acroynm stood for "Multiple Undergraduate Destroyer" due to their popularity amongst students and the amount of time devoted to them.
	                                                                    
In this coursework you are going to build a MUD engine called `ECS-MUD` using the [nodejs](http://www.nodejs.org) platform and deploy it in the cloud using the [Heroku](http://www.heroku.com) service. Rather than using telnet as the communication protocol, ECS-MUD will communicate with clients using the new HTLM5 [WebSockets](https://www.websocket.org) feature. Rather than starting from scratch, we have provided a basic MUD implementation to get you started, and you will need to implement a number of features to complete the game. 

##Effort
This coursework is worth 33% of the overall mark for the COMP3207 module; this equates to 45 hours of work. This coursework is meant to be an individual piece of work and the usual rules regarding individual coursework and academic integrity apply.

##Requirements
You need to do two things to complete this coursework:

* Complete the implementation of ECS-MUD so that it works as per the description in the [brief guide to ECS-MUD](guide.md). 
	- Development must be done using the GitHub repository we have set up for you (see below). 
	- All the code you need to write must be in the [Commands.js](scripts/Commands.js) file. 
	- The only other files you should need to edit are the [index.js](models/index.js) file in the models directory in order to change the Heroku Postgresql address to the one created for your application, and the [package.json](package.json) file in order to complete your details.
* Deploy the completed game to the Heroku cloud platform.
	- You'll need to sign-up for a free basic Heroku account and create an app.
	- Your Heroku app should be named `COMP3207-CW1-1415-<your-ecs-user-id>` (i.e. mine is `COMP3207-CW1-1415-jsh2`).
	- You'll also need to create a free Heroku Postgresql instance for the database.

##Deliverables
1. A working version of the MUD, deployed on the Heroku cloud platform
2. A short (maximum of 2 A4 sides) report including the following:
	* Your name, a link to your heroku app instance and your `ECS-COMP3207-1415/<your-github-id>-CW1` Github repository.
	* A description of any problems or challenges you encountered implementing the requirements.
	* Details of how you performed testing of the application, and what tools you used.

  **This should be uploaded to handin as a PDF document by the deadline, together with your `Commands.js` file (see next bullet).**
3. The source-code to the MUD, in your COMP3207 Github repository and with a copy of `Commands.js` uploaded to handin with the report PDF.

##Marking and feedback
Testing of your MUD will be performed using a set of automated bots that will connect to your Heroku app instance. **Please do not change the password of the default `Eric` character, or the ownership of the `Zepler Foyer` room as the automated scripts will use these for testing.**

Marks will be awarded for:
* Successfully completing the task.
* Completeness of implementation.
* Quality of submitted code.
* The report.

Feedback will be given for each of these points. In addition, we will endeavour to make comments about your development methodology as evidenced through the GitHub commit logs.

##Getting started
A requirement of this coursework is the use of GitHub to develop your code. We've created a GitHub organisation for the class to which your GitHub account should have been added. If you look in your GitHub account, you should see you have a `ECS-COMP3207-1415/<your-github-id>-CW1` repository. If you don't then [email](mailto:jsh2@ecs.soton.ac.uk) or speak to [Jon](http://ecs.soton.ac.uk/people/jsh2) immediately. Your individual copy of the `ECS-COMP3207-1415/<your-github-id>-CW1` repository is private to you and the lecturing staff involved with the course; the lecturers will be able to see any code you push, but fellow students will not. 

The `ECS-COMP3207-1415/<your-github-id>-CW1` repository contains the initial implementation of ECS-MUD, together with some documentation (this [README](README.md), the [brief guide to ECS-MUD](guide.md) and the [programmer's notes](notes.md). The [programmer's notes](notes.md) contain hints to help you run and develop the MUD.

##Questions
If you have any problems/questions then [email](mailto:jsh2@ecs.soton.ac.uk) or speak to [Jon](http://ecs.soton.ac.uk/people/jsh2), either in his office, or in one of the drop-in sessions in the UG-lab we'll run during the course.

##Bugs
As Bill Gates once said "There are no significant bugs in our released software that any significant number of users want fixed". More seriously though, if you do find a problem with the starter code we've provided, then let us know straight away.
