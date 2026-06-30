const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim ticket"),

  async execute(interaction) {
    await interaction.reply(`✅ ${interaction.user} claimed this ticket`);
  },
};
