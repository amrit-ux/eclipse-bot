const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add user to ticket")
    .addUserOption(opt =>
      opt.setName("user").setDescription("User").setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    await interaction.channel.permissionOverwrites.create(user.id, {
      ViewChannel: true,
    });

    await interaction.reply(`Added ${user}`);
  },
};
