



2. Login in to [Heroku](http://www.heroku.com) (create a free account if you don't already have one) and create a new application called `COMP3207-CW1-1415-<your ECS user id>` (e.g. mine is `COMP3207-CW1-1415-jsh2`).
3. Provision a free Heroku `postgresql` database for your newly created app.
4. Download/install [node](http://nodejs.org/download/) and [Heroku toolbelt](http://toolbelt.heroku.com/)
	* These do not necessarily need to be installed - there are straight binary packages that you can unpack and put in your filespace if you're using university/ECS machines.
	* If you download the binary version of node without the installer, you'll also need to download [npm](https://www.npmjs.org/doc/README.html).
	* If you are using the binary versions, you'll need to setup your `PATH` so that the `node`, `npm` and `heroku` tools can be accessed from the command-line.
5. Clone your `COMP3207-CW1-1415` repository and edit the `package.json` file to fill in your details.
6. From your local `COMP3207-CW1-1415` run the `npm install` command to setup the required dependencies.
7. Edit the `models/index.js` file so that it points at the database instance you provisioned.
8. Follow the instructions in the [Heroku dev center](https://devcenter.heroku.com/articles/git) to deploy the skeleton application (skip down to the bit about using an existing git repo ('You can also take an existing Git repo...')).
9. Go to `http://COMP3207-CW1-1415-<your ECS user id>.herokuapp.com` and test the application is working.
10. Spend some time looking over the code and getting to grips with the database schema.
11. Go implement the new features and test!


##Hints and tips

### Communicating with the player
All the strings you should need for player communication are in the (Strings.js)[scripts/Strings.js] file.

###Databases
The [SQLite CLI](http://www.sqlite.org/cli.html) can be used to help debug the contents of the development database. There are good instructions on dealing with the Heroku postgresql database [here](https://devcenter.heroku.com/articles/heroku-postgresql).

