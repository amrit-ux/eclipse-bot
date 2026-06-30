const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Setup ticket system"),

  async execute(interaction) {

    await interaction.reply({
      content: "🎫 Click to create ticket",
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Create Ticket",
              style: 1,
              custom_id: "create_ticket"
            }
          ]
        }
      ]
    });
  }
};
