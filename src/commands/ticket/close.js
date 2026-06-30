const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close ticket"),

  async execute(interaction) {
    await interaction.reply("Closing ticket...");
    setTimeout(() => interaction.channel.delete(), 2000);
  },
};
