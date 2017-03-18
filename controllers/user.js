const models = require('../models');
const helpers = require('./user-helpers');

const util = require('util');

//TODO: res.render partials and different template inputs at the same time,
//from the same res.render

const controller = {
	//when the root route loads, check the cookie against the session store
	// and load the signin page or the todo page accordingly
	land: (req, res) => {
		//how to get the cookie from the front end to compare it to the back end?
		console.log(`this is req.params.cookie ${req.params.cookie}`);
		models.ConnectSession.sync()
		.then(() => {
			return models.ConnectSession
			.findOne({
				where: { sid: req.params.cookie }
			})
			.then((data) => {
				console.log(`data.dataValues ${data.dataValues}`);
				if(data) {
					res.render('todos.hbs');
				} else {
					res.render('login.hbs');
				}
			})
			.catch((error) => {
				console.log(error);
				res.render('login.hbs');
			});
		})
		.catch((error) => {
			console.log(error);
		})

	},

	//save a new user to the db
	signupUser: (req, res) => {
		//body elements are email and password
		console.log(req.body);
		//sync models and save user to the Users table
		//hash password
		const hash = helpers.setHash(req.body.password);
		console.log(hash);
		//create new user to save
		const newUser = {
			email: req.body.email,
			password: hash
		}
		//sequelize call to save user
		models.User.sync()
		.then(() => {
			return models.User
				.create(newUser)
				.then((data) => {
					//TODO: add cookies and login user on signup. sessions?
					if(data) {
						req.session.message = 'Signup successful!  Start saving to-dos now.';
						helpers.saveSession(req, res, data);
						res.header('Cookie', req.session.id);
						res.render('todos.hbs', {data: req.session.message});
					} else if(!data) {
						req.session.message = 'Signup not successful.';
						helpers.saveSession(req, res, data);
						res.render('signup.hbs', {data: req.session.message});
					}
					console.log(`data from user save ${util.inspect(data)}`);
				});
		});

	},
	//login a user by authenticating login info against the DB
	loginUser: (req, res) => {
		//body elements are email and password
		console.log(req.body);
		//sync models and authenticate user against the Users table
		models.User.sync()
		.then(() => {
			return models.User
			.findOne({
				//obj destructing doesn't work.
				where: { email: req.body.email }
			})
			.then((data) => {
				//TODO: send a cookie instead of the data on login. sessions?
				console.log(`data ${util.inspect(data)}`);
				if(!data) {
					helpers.loginFail(req, res);
				} else {
					//compare stored hash to password sent in post request
					const hash = helpers.getHash(req.body.password, data.dataValues.password);
					if(hash) {
						req.session.message = `You have successfully logged in.`;
						helpers.saveSession(req, res, data);
						res.header('Cookie', req.session.id);
						res.render('todos.hbs', {data: req.session.message});
					} else {
						helpers.loginFail(req, res);
					}
				}
			})
			.catch((error) => console.log(error));
		});
	},
	logoutUser: (req, res) => {
		console.log(req.body);
		req.session.destroy();
		res.render('login.hbs');
		//
	},
	userSettings: (req, res) => {
		console.log(req.params);
		models.ConnectSession.sync()
		.then(() => {
			return models.ConnectSession
			.findOne({
				where: { sid: req.params.cookie }
			})
			.then((data) => {
				console.log(data.dataValues);
				sessionObj = JSON.parse(data.dataValues.data);
				console.log(sessionObj.email);
				res.render('settings.hbs', {email: sessionObj.email});
			})
		});

	},
	updateUser: (req, res) => {
		//the user will provide either a new password or a new email to update their account
		console.log(req.body);
		//they must send their current password to authorize them to change the data
		if(req.body.newPassword && req.body.newEmail) {
			const hash = helpers.setHash(req.body.newPassword)
			const objToUpdate = { password: hash, email: req.body.newEmail };
			helpers.updateUser(req, res, objToUpdate);
		} else if(req.body.newPassword) {
			//pass the new password to the helper function to change it
			const hash = helpers.setHash(req.body.newPassword)
			const objToUpdate = { password: hash };
			helpers.updateUser(req, res, objToUpdate);
		} else if(req.body.newEmail) {
			//pass the new email to the helper function to change it
			const objToUpdate = { email: req.body.newEmail };
			helpers.updateUser(req, res, objToUpdate);
		} else {
			req.session.message = 'Please check the data you were trying to change and send it again.';
			req.session.save();
			res.render('settings.hbs', {email: req.session.email})
		}
	},
	deleteUser: (req, res) => {
		console.log(req.body);
		models.User.sync()
		.then(() => {
			return models.User
			.findOne({
				where: { email: req.body.email }
			})
			.then((data) => {
				console.log(data.dataValues);
				const hash = helpers.getHash(req.body.password, data.dataValues.password);
				if(hash) {
					return models.User
					.destroy({
						//object destructuring doesn't work here either. pooh!
						where: { email: req.body.email }
					})
					.then((data) => {
						//response from deleting the user
						console.log(`data ${util.inspect(data)}`);
						console.log(typeof data);
						if(data === 0) {
							res.render('login.hbs', {data: `Sorry, your account wasn't deleted.  Please check your credentials and try again.`});
						} else if(data === 1) {
							res.render('login.hbs', {data: 'Your account and all your to-dos were successfully deleted.'});
						}
					});
				}
			});
		});
	}
}




module.exports = controller;
