const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['?'],
    desc: 'Shows the help menu',
    syntax: 'help',
    execute(msg, args, client) {
        // Define function to create embed
        makeEmbed = cmd => {
            // Create the embed
            const helpMenu = new MessageEmbed()
                .setColor('#08596e')
                .setTitle(cmd ? `__Help Menu: ${cmd.name}__` : '__Help Menu__')
                .setTimestamp()
                .setFooter(`${client.user.username} Help`)

            // If there isn't a command parameter passed as an argument
            if(!cmd) {
                // Get all the commands and remove the duplicates from aliases
                commands = [...new Set(Array.from(client.commands.values()))];
                // Loop through each command and add it to the menu
                commands.forEach(command => {
                    const name = command.name, desc = command.desc;
                    helpMenu.addField(name, desc, false);
                });
            // If there is a command parameter passed as an argument
            } else {
                // Set the description to be the passed command description
                helpMenu.setDescription(cmd.desc);
                // Add the syntax and aliases fields
                helpMenu.addFields(
                    { name: 'Syntax', value: cmd.syntax, inline: false },
                    { name: 'Aliases', value: cmd.aliases ? cmd.aliases.map(a => `\`${a.toString()}\``).join(', ') : '\`None\`' }
                );
            }

            return helpMenu;
        }

        // If there is a command specified for help
        if(args[0]) {
            // Get the command from bot
            let c = client.commands.get(args[0]);

            // Use our embed function to make the help embed for the command if it exists
            if (c) return msg.channel.send(makeEmbed(c));
            else return msg.reply('that command doesn\'t exist.').then(m => m.delete({ timeout: 3000 }));
        // There is no specified command so make the default one
        } else
            return msg.channel.send(makeEmbed(false));
    }
}
