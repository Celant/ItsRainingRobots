var Discord = require("discord.js");
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
module.exports = itsRainingRobotsModule;
