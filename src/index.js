const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");

// Get the bot's presence from include
const { prefix, presence } = require(join(__dirname, "include", "config.json"));

// Load our environment variables from the .env file
require("dotenv").config();

// Define bot client
const client = new Client();
client.commands = new Collection();

// Get all the folders in the commands directory
const cmdDirs = readdirSync(join(__dirname, "commands"), { withFileTypes: true }).filter(src => src.isDirectory());
// Loop through all of those folders
cmdDirs.forEach(dir => {
    // Get all the javascript files in the commands/dir directory
    let cmdFiles = readdirSync(join(__dirname, "commands", dir.name)).filter(file => file.endsWith(".js"));
    // Loop through all of the js files
    cmdFiles.forEach(file => {
        // Get the js file
        const cmd = require(join(__dirname, "commands", dir.name, file));
        // Set the command for our bot
        client.commands.set(cmd.name, cmd);
        // If the command has aliases loop through them all and add them as commands too
        if (cmd.aliases != null)
            cmd.aliases.forEach(alias => client.commands.set(alias, cmd));
    });
});

// Runs when the bot is ready
client.once("ready", () => {
    // Set the bot's presence
    client.user.setStatus(presence.status);
    client.user.setActivity(presence.activity, { type: presence.activityType });

    // Log information to the console
    console.log(`Loaded ${client.commands.map(c => c).length} commands and aliases.`);
    console.log(`${client.user.username} is online.`);
});

// Runs every time a message is sent
client.on("message", msg => {
    // Don't allow commands to be run by bots
    if (msg.author.bot) return;

    // If the message starts with the prefix
    if (msg.content.startsWith(prefix)) {
        // Get the args passed by removing the prefix and spliting at whitespaces
        const args = msg.content.slice(prefix.length).split(/ +/);
        // Get the command by shifting the first argument out of args
        const cmd = args.shift().toLowerCase();

        // Try to execute the command or return if it doesn't exist
        try { client.commands.get(cmd).execute(msg, args, client) }
        catch(e) { return; }
    }
    // If the message starts with a ping
    else if (msg.content.startsWith(`<@!${client.user.id}`)) {
        // Get the args passed by spliting the message at whitespaces and getting rid of the "mention"
        const args = msg.content.split(/ +/).slice(1);
        // Get the command by shifting the first argument out of args
        const cmd = args.shift().toLowerCase();

        // Try to execute the command or return if it doesn't exist
        try { client.commands.get(cmd).execute(msg, args, client) }
        catch(e) { return console.log(e); }
    }

    return;
});

// Log the bot in with the token from environment variables
client.login(process.env.PST_TOKEN);
