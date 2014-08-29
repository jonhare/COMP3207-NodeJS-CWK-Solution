#Programmer's notes

##Tools required
You will need to download/install [node](http://nodejs.org/download/) and [Heroku toolbelt](http://toolbelt.heroku.com/)
	* These do not necessarily need to be installed - there are straight binary packages that you can unpack and put in your filespace if you're using university/ECS machines.
	* If you download the binary version of node without the installer, you'll also need to download [npm](https://www.npmjs.org/doc/README.html).
	* If you are using the binary versions, you'll need to setup your `PATH` so that the `node`, `npm` and `heroku` tools can be accessed from the command-line.

##Running the application
From a locally cloned copy of your `ECS-COMP3207-1415/<your-github-id>-CW1` repository you can issue the following commands to run for the first time:

	npm install
	node web.js

On subsequent runs you won't need to run the `npm install` command. Once the application is running, you can connect to it as described in the next section. The application can be stopped by pressing `ctrl-c`.

##Connecting to your application
There are two ways to connect to the MUD: via the commmand-line, or via the built-in web interface. To access the web interface, open a browser and navigate to [http://localhost:5000/](http://localhost:5000/). 

To connect via the command-line, you can use a `wscat` tool that was built when you performed the `npm install` command. `wscat` can be found at `<your-github-id>-CW1/node_modules/ws/bin/wscat` and run using the following command:

	wscat --connect http://localhost:5000/ws

##Working with Heroku
You'll need to login in to [Heroku](http://www.heroku.com) (create a free account if you don't already have one) and create a new application called `COMP3207-CW1-1415-<your ECS user id>` (e.g. mine is `COMP3207-CW1-1415-jsh2`).
Whilst on the site, you should also provision a free Heroku `postgresql` database for your newly created app.

In order to deploy your app you will need to:
1. Edit the `package.json` file to fill in your details.
2. Edit the `models/index.js` file so that it points at the database instance you provisioned.

You should then be able to follow the instructions in the [Heroku dev center](https://devcenter.heroku.com/articles/git) to deploy the skeleton application (skip down to the bit about using an existing git repo ('You can also take an existing Git repo...')). Once done, you'll be able to visit `http://COMP3207-CW1-1415-<your ECS user id>.herokuapp.com` and test the application is working.

###Debugging on heroku
Typing `heroku logs` on the command line  will print out any errors encountered by the your application on the Heroku server, and is useful for finding problems. Any `console.log()` messages from your code will end up here.

###Databases
When running locally during development the application uses SQLite as the database. The [SQLite CLI](http://www.sqlite.org/cli.html) can be used to help debug the contents of the development database. If you ever need to reset the database completely, stop the node application and delete the database file (`dev-database.sqlite`).

When deployed on Heroku, the postgresql database is used. There are good instructions on dealing with the Heroku postgresql database [here](https://devcenter.heroku.com/articles/heroku-postgresql). In particular, the `heroku pg:psql` can be used to connect to your Heroku postgresql instance. The following commands can be used within the `psql` console to reset your database (removing all the tables):

	drop schema public cascade;
	create schema public;

You can also type standard SQL commands to query the database, etc (note that table names are case sensitive!).

##Hints and tips for completing the game

* Spend some time understanding the code before you start - we've added plenty of comments to help you.
* All the strings you should need for player communication are in the (Strings.js)[scripts/Strings.js] file.
* The (Predicates.js)[scripts/Predicates.js] file has checks for a number of things that you'll need to check - please use them!
	- In particular, the `canDoIt` method provides all the logic required for testing whether an action (`go` or `take`) can be performed by a player on a thing, and also handles sending the relevant success/failure messages.
* The controller has some very useful methods for finding named objects (or a named object) accessible to the player (in the same room, or in their inventory). The name lookup scheme allows partial matches and lets the player know if the name is ambiguous.

