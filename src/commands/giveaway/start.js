const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gstart")
    .setDescription("Start giveaway"),

  async execute(interaction) {
    await interaction.reply("🎉 Giveaway started (basic)");
  },
};
