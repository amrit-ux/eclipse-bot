const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reroll")
    .setDescription("Reroll giveaway"),

  async execute(interaction) {
    await interaction.reply("🔄 Rerolled");
  },
};
