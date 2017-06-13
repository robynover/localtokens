## Requirements

1. Recent version of Node.js -- https://nodejs.org/en/
2. PostgreSQL -- for Mac at http://postgresapp.com/
3. MongoDB -- install with homebrew on Mac https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/


## Install

1. Check out repo
2. From the project directory, run `npm install`
3. Create a config file and directory  -- make a new directory called "config" at the top level of the project and create a file inside it called "config.js" (see example below for its contents). Fill in your postgres username and password
4. Launch the app: `node app.js` -- this will create the Postgres tables
5. In the script `passwordgen.js`, fill in your password, save it, then on the command line, from the project directory, run `node passwordgen.js` -- the output is the encrypted password that will go in the database for your first user
6. Create your first user in the database
	* Open Postgres.app follow set-up instructions. Then from the elephant icon on the menu bar, select "Open psql"
	* In the terminal window that opens, type `\c communitycred` to connect to the database (assuming your db is called `communitycred`)
	* Run the following SQL: `INSERT INTO users (username,firstname,password,created_at,updated_at) VALUES ('you', 'You', 'the encrypted password from step 5', now(), now() );`, replacing the values with your username, first name, and password
7. Go to `http://localhost:3333` and sign in with your username and password (not the encrypted one, but the one you used to get the encrypted version)



### sample config.js file contents

```
	module.exports = {
		development: {
			pg: 'postgres://user:pw@localhost:5432/communitycred',
			session: 'somephrasehere',
			salt: 'somerandomlettersandnumbers',
			mongo: 'mongodb://localhost/mydb',
			mongoSession: 'mongodb://localhost/sessiondb',
			sendgrid: 'sendgridAPIkey',
			inviteSalt: 'morerandomcharacters',
			sendgridListId: 'sendgridListIdHere'
		}
	};
```

### Front end
All of the compiled and minified css and js files are in the repo, so to get started, you won't need to do anything to get them to work. When you make changes, though, you'll need to run the following:

	* Changes to sass: `grunt css`
	* Changes to js: `grunt uglify`
	* Changes to riot.js `.tag` files: `riot public/js/tags/something.tag` (will produce the file `something.js`) 