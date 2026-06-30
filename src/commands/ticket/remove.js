const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove user from ticket")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User").setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    await interaction.channel.permissionOverwrites.delete(user.id);

    await interaction.reply(`Removed ${user}`);
  },
};
