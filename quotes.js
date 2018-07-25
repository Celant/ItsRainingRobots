var Discord = require("discord.js");
var _ = require("lodash");

class quotesModule {
	constructor(bot) {
		this.bot = bot;
		this.commands = bot.commands;
		this.perms = bot.commands.perms;
	}

	preInit() {

	}

	init() {
		this.registerCommands();
	}

	postInit() {
	
	}

	registerCommands() {
		var self = this;

		self.commands.addCommand({
			trigger: "!addquote",
			function: self.addQuoteCommand,
			permCheck: self.perms.pass,
			thisarg: this
		});
		self.commands.addCommand({
			trigger: "!delquote",
			function: self.delQuoteCommand,
			permCheck: self.perms.isInAdminRoom,
			thisarg: this
		});
	}


	addQuote(quote, msg, callback) {
		var self = this;

		return new Promise(function(resolve, reject) {

			var sqlProps = [
				quote.content,
				quote.author.id,
				quote.createdAt,
				quote.channel.id,
				msg.author.id,
				quote.guild.id
			];

			self.bot.mysql.query("INSERT INTO quotes (`content`, `authorid`, `timestamp`, `channel`, `addedbyid`, `guildid`) VALUES (?,?,?,?,?,?)", sqlProps, function(err, res) {
				if (err) {
					reject(err);
					return
				}

				resolve(res.insertId);
			});
		});
	}

	delQuote(quoteId, callback) {
		var self = this;

		return new Promise(function(resolve, reject) {

			self.bot.mysql.query("DELETE FROM quotes WHERE id=?", quoteId, function(err, res) {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			});
		});
	}

	checkQuoteExists(quoteId, callback) {
		var self = this;

		return new Promise(function(resolve, reject) {
			self.bot.mysql.query("SELECT COUNT(id) AS count FROM quotes WHERE id=?", quoteId, function(err, res) {
				if (err) {
					reject(err);
					return;
				}

				if (res[0].count === 1) {
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	}

	fetchQuote(quoteId, fromUser, context) {
		return new Promise(function(resolve, reject) {
			let query = "";
			let queryOpts = [];

			if (quoteId) {
				query = "SELECT *, DATE_FORMAT(timestamp,\"%Y-%m-%dT%TZ\") AS timestamp FROM quotes WHERE id=?";
			} else {
				if (fromUser) {
					query = "SELECT *, DATE_FORMAT(timestamp, \"%Y-%m-%dT%TZ\") AS timestamp FROM quotes WHERE authorid=? ORDER BY RAND() LIMIT 1";
					queryOpts.push(fromUser.id);
				} else {
					query = "SELECT *, DATE_FORMAT(timestamp, \"%Y-%m-%dT%TZ\") AS timestamp FROM quotes ORDER BY RAND() LIMIT 1";
				}
			}

			self.bot.mysql.query(query, queryOpts, function(err, res) {
				if (err) {
					reject(err);
					return;
				}

				var quote = res[0];

				if (quote) {
					resolve(self.formatQuote(quote, context));
				} else {
					reject();
				}
			});
		});
	}

	formatQuote(quote, context) {
		var self = this;

		var member = context.guild.members.get(quote.authorid);
		var channel = context.guild.channels.get(quote.channel);
		if (member === undefined) {
			member.displayName = quote.authorid;
			member.user = {};
			member.user.displayAvatarURL = function() { return "https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png" }
		}
		if (channel === undefined) {
			channel = {}
			channel.name = "Unknown Channel";
		}

		var embed = {
			color: 16035906,
			timestamp: quote.timestamp,
			author: {
				name: member.displayName,
				icon_url: member.user.displayAvatarURL()
			},
			description: quote.content,
			footer: {
				text: "In " + channel.name
			}
		}

		return embed;
	}

	addQuoteCommand(msg) {
		var self = this;

		if (msg.parts[1]) {
			if (/^\d{5,25}$/.test(msg.parts[1])) {
				var messageId = msg.parts[1];

				var messagePromise = msg.channel.messages.fetch({around: messageId, limit: 1});

				messagePromise.then(function(messages) {
					var quote = messages.first();
					self.addQuote(quote, msg).then(function(quoteId) {
						self.fetchQuote(quoteId, msg).then(function(quote) {
							msg.reply("added as quote " + quoteId + " :white_check_mark:", {
								embed: quote
							});
						}).catch(function(err) {
							console.log(err);
							msg.reply("looks like the quote got stuck somewhere! :slight_frown:");
						});
					}).catch(function(err) {
						console.log(err);
						msg.reply("looks like the quote didn't save properly in my database :slight_frown:");
					});
				}).catch(function(err) {
					console.log(err);
					msg.reply("I couldn't find that message. Is the ID correct, or has the message been deleted? :confounded:");
				});
			}
		} else {

		}
	}

	delQuoteCommand(msg) {
		var self = this;

		var quoteId = msg.parts[1];

		if (quoteId) {
			self.checkQuoteExists(quoteId).then(function(exists) {
				if (!exists) {
					msg.reply("that quote does not exist!");
					return;
				}

				self.delQuote(msg.parts[1]).catch(function(err) {
					console.log(err);
					msg.reply("internal error occured :slight_frown:");
				});

			}).catch(function(err) {
				console.log(err);
				msg.reply("internal error occured :slight_frown:");
				return;
			});
		}
	}

	quoteCommand(msg) {
		var self = this;

		let mentions = msg.orderedMentions();

		if (mentions[0]) {
			self.fetchQuote(null, mentions[0], msg).then(function(quote) {
				msg.reply("", { embed: quote });
			}).catch(function(err) {
				console.log(err);
				msg.reply("I couldn't find any quotes of that user :thinking:");
			});
		} else {
			if (msg.parts[1] && /^\d{1,6}$/.test(msg.parts[1])) {
				self.fetchQuote(msg.parts[1], null, msg).then(function(quote) {

				}).catch(function(err) {
					console.log(err);
					msg.reply("I couldn't find that quote :thinking:");
				});
			} else {
				self.fetchQuote(null, null, msg).then(function(quote) {

				}).catch(function(err) {
					console.log(err);
					msg.reply("I couldn't find any quotes :thinking:");
				});
			}
		}
	}
}
module.exports = quotesModule;
