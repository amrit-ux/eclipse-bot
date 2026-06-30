const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rename")
    .setDescription("Rename ticket")
    .addStringOption(opt =>
      opt.setName("name").setDescription("New name").setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString("name");
    await interaction.channel.setName(name);
    await interaction.reply(`Renamed to ${name}`);
  },
};
