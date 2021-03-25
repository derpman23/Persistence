const fs = require("fs");
const { join } = require("path");
const { writeFileRecursive } = require(join(process.cwd(), "src", "include", "fs-extender.js"));

var cooldown = new Set();

module.exports = {
    name: "answer",
    aliases: ["ans"],
    desc: "Set the answer for the challenge",
    syntax: "answer [<answer>, set <answer>, role <role>, channel <channel>, reset]",
    execute(msg, args, client) {
        let answer = {};

        // If the answer data file doesn't exist, make it
        if (!fs.existsSync(join(process.cwd(), "src", "data", "answer.json")))
            writeFileRecursive(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , "\t"), overwrite = false);
        // If the answer data file exists, read it
        else
            answer = require(join(process.cwd(), "src", "data", "answer.json"));

        // If there are no arguments passed it is an invalid syntax
        if (!args[0])
            return msg.reply(`invalid syntax. Please use: ${this.syntax}`);

        // If the command is to set the answer
        if (args[0].toLowerCase() == "set") {
            client.guilds.fetch(process.env.GUILD_ID).then(guild => {
                guild.members.fetch(msg.author.id).then(user => {
                    // Only administrators and server owners can set the answer
                    if (!user.hasPermission("ADMINISTRATOR", { checkOwner: true }))
                        return msg.reply("only administrators and owners can set the answer.");

                    // Make sure the answer to set is a number
                    if (isNaN(args[1]))
                        return msg.reply("answer must be a number.");
                    
                    // Set the answer from the provided value
                    answer.answer = Number.parseFloat(args[1]);
                        
                    // Write the answer to file
                    fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , "\t"), err => {
                        if (err) console.error(err);
                    });
                    
                    // Delete message and send confirmation
                    msg.reply('successfully set answer.');
                    return msg.delete();
                });
            });
        }
        else if (args[0].toLowerCase() == "role") {
            // Channel can only be set from a guild
            if (msg.channel.type == "dm")
                return msg.reply("you need to be in a guild to set the channel.");

            client.guilds.fetch(process.env.GUILD_ID).then(guild => {
                guild.members.fetch(msg.author.id).then(user => {
                    // Only administrators and server owners can set the answer
                    if (!user.hasPermission("ADMINISTRATOR"))
                        return msg.reply("only administrators and owners can set the role.");
                    
                    // Missing the required role mention or id
                    if (!args[1])
                        return msg.reply("you need to specify a role to give.");

                    // Parse the role if needed to allow pings and ids
                    args[1] = (args[1].startsWith("<@&") && args[1].endsWith(">")) ? args[1].slice(3, -1) : args[1];

                    // Set the role to give solvers by id
                    answer.role = args[1];

                    // Update the data file
                    fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , "\t"), err => {
                        if (err) console.error(err);
                    });

                    return msg.reply("successfully set the answer role!");
                });
            });
        }
        else if (args[0].toLowerCase() == "channel") {
            // Channel can only be set from a guild
            if (msg.channel.type == "dm")
                return msg.reply("you need to be in a guild to set the channel.");

            client.guilds.fetch(process.env.GUILD_ID).then(guild => {
                guild.members.fetch(msg.author.id).then(user => {
                    // Only administrators and server owners can set the answer
                    if (!user.hasPermission("ADMINISTRATOR", { checkOwner: true }))
                        return msg.reply("only administrators and owners can set the channel.");

                    // Missing the required channel mention or id
                    if (!args[1])
                        return msg.reply("you need to specify a channel to respond in.");

                    // Get the channel
                    if (args[1].startsWith("<#") && args[1].endsWith(">"))
                        args[1] = args[1].slice(2, -1);

                    // Set the role to give solvers by id
                    answer.channel = args[1];

                    // Update the data file
                    fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , "\t"), err => {
                        if (err) console.error(err);
                    });

                    return msg.reply("successfully set the channel!");
                });
            });   
        }
        else if (args[0].toLowerCase() == "reset") {
            client.guilds.fetch(process.env.GUILD_ID).then(guild => {
                guild.members.fetch(msg.author.id).then(user => {
                    // Only administrators and server owners can set the answer
                    if (!user.hasPermission("ADMINISTRATOR", { checkOwner: true }))
                        return msg.reply("only administrators and owners can set the channel.");

                    //remove solver role
                    guild.roles.fetch(answer.role).then(role => {
                        const members = role.members;

                        members.forEach(member => member.roles.remove(answer.role));
                    });
                    
                    //reset json values for answer and solver
                    answer.solvers = [];
                    answer.answer = null;

                    // Update the data file
                    fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , "\t"), err => {
                        if (err) console.error(err);
                    });

                    return msg.reply("successfully reset the answer and solvers!");
                });
            });
        }
        // The command is a submission
        else {
            //check if cooldown
            if (cooldown.has(msg.author.id)) {
                msg.react("⌛");

                return msg.delete({timeout : 3000});
            }

            // Check if an answer is set
            if (answer.answer === null)
                return msg.reply("an answer isn't set.")
            
            // Makes sure the submission is a number
            if (isNaN(args[0]))
                return msg.reply("the answer has to be a number.");

            // Get the user submission and the real answer
            let num = Number.parseFloat(args[0]);
            let ans = answer.answer;

            // If the list of solvers doesn't exist create it
            if (!answer.solvers)
                answer.solvers = [];

            // Check if the answer was correct
            if (num === ans) {
                // make sure the answerer hasn't already solved
                if ((answer.solvers).indexOf(msg.author.id) != -1) {
                    msg.delete();
                    return msg.reply("you already solved it!").then(m => m.delete({ timeout: 3000 }));
                }

                // Add the solver to the list of solvers
                (answer.solvers).push(msg.author.id);

                // Update the data file
                fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , "\t"), err => {
                    if (err) console.error(err);
                });

                // Role to give to answerers exists
                if (answer.role)
                    // Get the role to give it to the solver
                    client.guilds.fetch(process.env.GUILD_ID).then(guild => {
                        guild.roles.fetch(answer.role).then(role => {
                            guild.members.fetch(msg.author.id).then(user => user.roles.add(role));
                        });
                    });

                // Channel to sent messages to exists
                if (answer.channel)
                    // Send the message to the channel
                    client.guilds.fetch(process.env.GUILD_ID).then(guild => {
                        let channel = guild.channels.cache.get(answer.channel);
                        channel.send(`<@${msg.author.id}> solved it!`);
                    });

                msg.react("✅");
                if (msg.channel.type != "dm")
                    return msg.delete({ timeout: 3000 });
                else
                    return
            }
            else {
                msg.react("❌");

                msg.delete({ timeout: 3000 });

                //add cooldown 10 sec
                cooldown.add(msg.author.id);

                setTimeout(() => cooldown.delete(msg.author.id), 10000);
            }
        }
    }
}
