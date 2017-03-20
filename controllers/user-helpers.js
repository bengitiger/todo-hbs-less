
const models = require('../models');
const bcrypt = require('bcryptjs');
const util = require('util');

const helpers = {
	updateUser: (req, res, objToUpdate) => {
		//sync user model
		models.User.sync()
		.then(() => {
			//query Users table for email in the session
			return models.User
			.findOne({
				where: { email: req.session.email }
			})
			.then((data) => {
				//if the session email exists in the Users table
				console.log(data.dataValues);
				//dehash password
				const hash = helpers.getHash(req.body.password, data.dataValues.password);
				console.log(hash);
				//if current password matches stored hash
				if(hash) {
					models.User.sync()
					.then(() => {
						//pass object to replace Users table row values, either username,
						//password, or both, where the email matches the session email
						return models.User
						.update(objToUpdate, {
							where: { email: req.session.email }
						})
						.then((result) => {
							//returned object from the update call
							//console.log(`result in update user ${util.inspect(result)}`);
							//stringify the data object so that we can check the value
							//to determine the message to send
							//can't compare objects/arrays for equality
							dataStr = JSON.stringify(result);
							//console.log(dataStr)
							if(dataStr === '[0]') {
								//if no User record was updated
								helpers.settingsSessMessage(req, res, `Info not updated.  Try again.`, null, null);
							} else if (dataStr === '[1]') {
								//if one User record was updated
								helpers.settingsSessMessage(req, res, `You're golden!  Please use your new credentials to login in the future.`, req.body.newEmail, helpers.setHash(req.body.newPassword));
							} else {
								//more than one User record is updated, yikes!
								helpers.settingsSessMessage(req, res, `Error.`, null, null);
							}
						});
					})
					.catch((error) => {
						//the update call doesn't return an object
						helpers.settingsSessMessage(req, res, `Info not updated.  Try again.`, null, null);
					})
				} else {
					//the current password doesn't match the stored hash
					helpers.settingsSessMessage(req, res, `Your current password doesn't match our records.`, null, null);
				}
			})

		});
	},
	//bcrypt save password
	setHash: (password) => {
		const salt = bcrypt.genSaltSync(10);
		if(password) {
			return bcrypt.hashSync(password, salt);
		} else {
			return false
		}
	},
	//bcrypt retrieve password
	getHash: (password, hash) => {
		return bcrypt.compareSync(password, hash);
	},
	//create a session object with stored email
	saveSession: function(req, res, data) {
    req.session.email = data.dataValues.email;
		req.session.password = data.dataValues.password;
    req.session.cookie.expires = 1000 * 60 * 60 * 24 * 3;
    req.session.save();
  },
	//save a session message and render to a template,
	//possibly with the session email
	sessionMessage: (req, res, message, render) => {
		req.session.message = message;
		req.session.save();
		res.render(render, {data: req.session.message});
	},
	settingsSessMessage: (req, res, message, email, hash) => {
		req.session.message = message;
		if(hash) {
			req.session.password = hash;
		}
		if(email) {
			req.session.email = email;
		}
		req.session.save();
		req.session.save('settings.hbs', {data: req.session.message, email: req.session.email})
	}
}

module.exports = helpers;
