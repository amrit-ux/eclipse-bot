const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Create ticket panel"),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("🎫 Support System")
      .setDescription("Click below to create ticket")
      .setColor("Blue");

    const row = {
      type: 1,
      components: [
        {
          type: 2,
          label: "Create Ticket",
          style: 1,
          custom_id: "create_ticket"
        }
      ]
    };

    await interaction.channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({ content: "Panel created", ephemeral: true });
  }
};
