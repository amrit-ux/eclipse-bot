const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gend")
    .setDescription("End giveaway"),

  async execute(interaction) {
    await interaction.reply("Giveaway ended");
  },
};
