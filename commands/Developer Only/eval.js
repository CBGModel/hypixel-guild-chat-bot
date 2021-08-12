const { MessageEmbed, MessageActionRow } = require('discord.js');
const config = require('../../config');
const hastebin = require('hastebin');

module.exports = {
   name: 'eval',
   description: 'Evaluates JavaScript code (bot owner only)',
   async execute(interaction, bot) {
      let start = Date.now();
      // —— Set the command itself
      const data = {
         name: this.name,
         description: this.description,
         defaultPermission: false,
         options: [
            {
               name: 'code',
               type: 'STRING',
               description: 'The code to evaluate',
               required: true,
            },
            {
               name: 'hide',
               type: 'BOOLEAN',
               description: 'Hide the embed from other users',
               required: false,
            },
         ],
      };
      // —— Set command permissions
      const permissions = [
         {
            id: config.ids.owner,
            type: 'USER',
            permission: true,
         },
      ];
      const commandProd = await bot.guilds.cache.get(config.ids.server)?.commands.create(data);
      const commandDev = await bot.guilds.cache.get(config.ids.testingServer)?.commands.create(data);
      await commandProd.permissions.add({ permissions });
      await commandDev.permissions.add({ permissions });

      // —— Clean text function
      function clean(text) {
         if (typeof text === 'string')
            return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
         return text;
      }

      // —— Set str code and bool hide (which sets reply to ephermial)
      const code = interaction.options.getString('code');
      const hide = interaction.options.getBoolean('hide');

      try {
         let evaled = eval(code);
         if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
         // Prevent all token leaking
         if (evaled.includes(bot.token)) {
            evaled = evaled.replace(bot.token, 'undefined');
         }
         if (evaled.includes(process.env.BOT_TOKEN)) {
            evaled = evaled.replace(process.env.BOT_TOKEN, 'undefined');
         }
         let end = Date.now();

         // —— Long req
         const longRequestEmbed = new MessageEmbed()
            .setTitle('Evaluate - Result Too Long  📜')
            .setColor(config.colours.informational)
            .setDescription(`Generating Hastebin link. Please wait... :hourglass:`)
            .setTimestamp()
            .setFooter(`Execution time: ${end - start}ms`, interaction.user.displayAvatarURL({ dynamic: true }));

         if (evaled.length > 999) {
            if (hide) {
               interaction.reply({
                  embeds: [longRequestEmbed],
                  ephemeral: true,
               });
            }
            interaction.reply({
               embeds: [longRequestEmbed],
            });
            hastebin
               .createPaste(clean(evaled), {
                  raw: false,
                  contentType: 'text/plain',
                  server: 'https://haste.zneix.eu/',
               })
               .then((url) => {
                  const resultEmbed = new MessageEmbed()
                     .setTitle('Evaluate - Result Too Long  📜')
                     .setColor(config.colours.informational)
                     .addFields({
                        name: `Input`,
                        value: `\`\`\`js\n${code}\`\`\``,
                     })
                     .addFields({
                        name: `Output`,
                        value: `[Click to view result!](${url})`,
                     })
                     .setTimestamp()
                     .setFooter(`Execution time: ${end - start}ms`, interaction.user.displayAvatarURL({ dynamic: true }));
                  return interaction.editReply({
                     embeds: [resultEmbed],
                  });
               })
               .catch((e) => console.error(e));
            return;
         }

         // —— Successful eval
         const evalEmbed = new MessageEmbed()
            .setTitle('Evaluate - Completed  ✅')
            .setColor(config.colours.success)
            .addFields({
               name: `Input`,
               value: `\`\`\`js\n${code}\`\`\``,
            })
            .addFields({
               name: `Output`,
               value: `\`\`\`yaml\n${clean(evaled)}\`\`\``,
            })
            .setTimestamp()
            .setFooter(`Execution time: ${end - start}ms`, interaction.user.displayAvatarURL({ dynamic: true }));
         if (hide) {
            return interaction.reply({
               embeds: [evalEmbed],
               ephemeral: true,
            });
         }
         return interaction.reply({
            embeds: [evalEmbed],
         });

         // —— Unsuccessful eval
      } catch (error) {
         const errorEmbed = new MessageEmbed()
            .setTitle('Evaluate - Error  ❌')
            .setColor(config.colours.error)
            .addFields({
               name: `Input  📥`,
               value: `\`\`\`js\n${code}\`\`\``,
            })
            .addFields({
               name: `Output  📤`,
               value: `\`\`\`fix\n${clean(error)}\`\`\``,
            })
            .setTimestamp()
            .setFooter(
               `Executed by ${interaction.user.username}#${interaction.user.discriminator}`,
               interaction.user.displayAvatarURL({ dynamic: true })
            );
         if (hide) {
            return interaction.reply({
               content: `An error has occurred.`,
               embeds: [errorEmbed],
               ephemeral: true,
            });
         }
         return interaction.reply({
            content: `An error has occurred.`,
            embeds: [errorEmbed],
         });
      }
   },
};
