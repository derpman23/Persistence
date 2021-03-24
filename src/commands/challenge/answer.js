const fs = require("fs");
const { join } = require("path");
const { fileExists } = require("../../include/fs-extender");
const { writeFileRecursive } = require(join(process.cwd(), "src", "include", "fs-extender.js"));

module.exports = {
    name: "answer",
    aliases: ["ans"],
    desc: "Set the answer for the challenge",
    syntax: "answer [set, give] <answer>",
    execute(msg, args, client) {
        // Answer will be filled by making or requiring the file
        let answer;

        // If the answer data file doesn't exist, make it
        if (!fs.existsSync(join(process.cwd(), "src", "data", "answer.json")))
        {
            answer = {};
            writeFileRecursive(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , 4), overwrite = false);
        }
        // If the answer data file exists, read it
        else
            answer = require(join(process.cwd(), "src", "data", "answer.json"));

        // If there are no arguments passed it is an invalid syntax
        if (!args[0])
            return msg.reply(`invalid syntax. Please use: ${this.syntax}`);

        // If the command is to set the answer
        if (args[0].toLowerCase() == "set") {
            // Answers can only be set from a guild
            if (msg.channel.type == "dm")
                return msg.reply("answers can only be set from a guild.");

            // Only administrators and server owners can set the answer
            if (!msg.member.hasPermission("ADMINISTRATOR") && msg.member.id != msg.guild.ownerID)
                return msg.reply("only administrators can set the answer.");
                
            // Make sure the answer to set is a number
            if (isNaN(args[1]))
                return msg.reply("answer must be a number.");
                
            answer.answer = Number.parseFloat(args[1]);
                
            // Write the answer to file
            fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , 4), err => {
                if (err) console.error(err);
            });
            
            // Delete message and send confirmation
            msg.reply('successfully set answer.');
            return msg.delete();
        }
        else if (args[0].toLowerCase() == "give") {
            // Only administrators and server owners can give the answerers a role
            if (!msg.member.hasPermission("ADMINISTRATOR") && msg.member.id != msg.guild.ownerID)
                return msg.reply("only administrators can set the answer.");

            if (!args[1])
                return msg.reply("you need to specify a role to give.");

            // Get the role
            if (args[1].startsWith("<@&") && args[1].endsWith(">"))
                args[1] = args[1].slice(3, -1);

            // Alert if there are no solvers
            if (!answer.solvers)
                return msg.reply("no one has solved this.");

            // Get the role to give to solvers
            const role = msg.guild.roles.cache.get(args[1]);

            // Loop through all the solvers and give them the role
            for (const user_id of answer.solvers)
                msg.guild.members.cache.get(user_id).roles.add(role);

            // Reset the answer and solvers
            answer.answer = null;
            answer.solvers = [];

            // Update the data file
            fs.writeFile(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , 4), err => {
                if (err) console.error(err);
            });

            return msg.reply("gave solvers that role!");
        }
        // The command is a submission
        else {
            // Check if an answer is set
            if (answer.answer === null)
                return msg.reply("an answer isn't set.")
            
            // Makes sure the submission is a number
            if (isNaN(args[0]))
                return msg.reply("the answer has to be a number.");

            // Get the user submission and the real answer
            let num = Number.parseFloat(args[0]);
            let ans = answer.answer;

            // Check if the answer was correct
            if (num === ans) {
                // Make the list of solvers if it doesn't exist
                if (!answer.solvers)
                    answer.solvers = [];

                // Add the user to the solvers list
                answer.solvers.push(msg.author.id);

                // Update the data file
                fs.writeFileSync(join(process.cwd(), "src", "data", "answer.json"), JSON.stringify(answer, null , 4), err => {
                    if (err) console.error(err);
                });

                return msg.react("✅");
            }
            else
                return msg.react("❌");
        }
    }
}
