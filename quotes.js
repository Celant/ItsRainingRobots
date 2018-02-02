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
			permCheck: self.perms.pass
		});
		self.commands.addCommand({
			trigger: "!roll",
			function: self.rollCommand,
			permCheck: self.perms.pass
		});
	}

	addQuoteCommand(msg) {
		var self = this;

		if (msg.parts[1]) {
			if (/^\d{5,25}$/.test(msg.parts[1])) {
				var messageId = msg.parts[1];
				guild.search({
					minID: messageId,
					maxID: messageId,
					contextSize: 0,
					limit: 1
				}).then(res => {
					const hit = res.results[0].find(m => m.hit);

					if (hit) {
						addQuoteToDatabase(quote, msg, function(err, quoteId) {
							var quote = fetchQuote(quoteId, msg, function(err, quote) {
								if (err) {
									msg.reply("looks like the quote didn't save properly in my database :slight_frown: :disagree:");
									return;
								}

								msg.reply("added as quote " + quoteId + " :agree:", {
									embed: quote
								});
							});	
						});
					} else {
						msg.reply("I'm afraid I couldn't find that message, double check it's ID, and that it still exists!");
					}
				}).catch(err => {
					msg.reply("a fatal error happened while trying to find that meassage :slight_frown:");
				});
			}
		} else {

		}
	}

	addQuoteToDatabase(quote, msg, callback) {
		var sqlProps = [
			quote.content,
			quote.author.id,
			quote.channel.id,
			msg.author.id,
			quote.guild.id
		];

		self.bot.mysql.query("INSET INTO quotes (`content`, `authorid`, `timestamp`, `channel`, `addedbyid`, `guildid`) VALUES (?,?,?,NOW(),?,?)", sqlProps, function(err, res) {
			if (err) {
				console.log(err);
				callback(err, null);
			}

			callback(null, res.insertId);
		});
	}

	fetchQuote(quoteId, msg, callback) {
		self.bot.mysql.query("SELECT *, DATE_FORMAT(timestamp,"%Y-%m-%dT%TZ") AS timestamp FROM quotes WHERE id=?", [quoteId], function(err, res) {
			if (err) {
				console.log(err);
				callback(err, null);
			}

			var quote = res[0];

			msg.guild.members.fetch(quote.authorid)
			.then(member => {
				var embed = {
					color: 16035906,
					timestamp: quote.timestamp,
					author: {
						name: member.displayName,
						icon_url: member.user.displayAvatarURL()
					},
					description: quote.content,
					footer: {
						text: "In #" + quote.channel
					}
				}

				callback(null, embed);

			});

		}
	}

	punCommand(msg) {
		var self = this;

		self.bot.mysql.query("INSERT INTO puns (`submitter`, `added`) VALUES (?, NOW())", [msg.author.username], function(err, res){
			if (err) {
				console.log(err);
			}
		});

		self.bot.mysql.query("SELECT COUNT(*) AS count FROM puns", function(err, res) {
                        if (err) {
                                throw err;
                        }
                        var total = res[0].count;

			msg.reply("You incremented the pun counter, there has been " + total + " terrible puns! :cactus:");
                });
	}
}
module.exports = quotesModule;
