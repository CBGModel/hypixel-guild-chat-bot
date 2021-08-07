const {
    MessageEmbed
} = require('discord.js');
const config = require('../../config');

module.exports = {
    name: 'uptime',
    aliases: ['up', 'time', 'timeup', 'timeonline'],
    description: 'Displays the current uptime of the bot',
    usage: ' ',
    cooldown: 5,
    perms: "None",
    /**
     * @param {Message} message
     */
    execute(message) {

        let days = Math.floor(process.uptime() / 86400);
        let hours = Math.floor(process.uptime() / 3600) % 24;
        let minutes = Math.floor(process.uptime() / 60) % 60;
        let seconds = Math.floor(process.uptime() % 60);

        const uptimeEmbed = new MessageEmbed()
            .setTitle('Bot Uptime')
            .setColor(config.colours.success)
            .setDescription(`Time since last restart:\n\n**${days}** day(s)\n**${hours}** hour(s)\n**${minutes}** minute(s)\n**${seconds}** second(s)`)
            .setTimestamp()
            .setFooter(config.messages.footer);
        message.channel.send({
            embeds: [uptimeEmbed]
        });
    }
};