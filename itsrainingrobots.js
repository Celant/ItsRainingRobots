var Discord = require("discord.js");
var droll = require('droll');
var _ = require("lodash");

class itsRainingRobotsModule {
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
			trigger: "!pun",
			function: self.punCommand,
			permCheck: self.perms.pass
		});
		self.commands.addCommand({
			trigger: "!roll",
			function: self.rollCommand,
			permCheck: self.perms.pass
		});
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

	rollCommand(msg) {
		var self = this;

		if (msg.parts[1]) {
			if (droll.validate(msg.parts[1])) {
				var rollResult = droll.roll(msg.parts[1]);

				if (rollresult.rolls) {
					var joinedRoll = rollResult.rolls.join(', ');

					if (joinedRoll.length <= 1800) {
						msg.reply("you rolled `" + msg.parts[1] + "` and got: `" + joinedRoll + "` :game_die:");
					} else {
						msg.reply("nice roll and stuff but that resulted in more than 1800 characters, which upsets discord :slight_frown:");
					}
				}
			} else {
				msg.reply("you rolled `" + msg.parts[1] + "` but that is incomprehensible gibberish, so you critical fail at life :poop:");
			}
		}
	}
}
module.exports = itsRainingRobotsModule;
