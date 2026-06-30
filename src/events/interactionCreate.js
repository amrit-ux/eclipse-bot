const { createTranscript } = require("../utils/transcript");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {

    // COMMANDS
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd) await cmd.execute(interaction);
    }

    // BUTTONS
    if (interaction.isButton()) {

      // CREATE
      if (interaction.customId === "create_ticket") {

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: 0
        });

        await channel.send({
          content: `👋 Welcome ${interaction.user}`,
          components: [
            {
              type: 1,
              components: [
                { type: 2, label: "Claim", style: 2, custom_id: "claim_ticket" },
                { type: 2, label: "Close", style: 4, custom_id: "close_ticket" }
              ]
            }
          ]
        });

        await interaction.reply({ content: "Ticket created!", ephemeral: true });
      }

      // CLAIM
      if (interaction.customId === "claim_ticket") {
        await interaction.reply(`✅ ${interaction.user} claimed this ticket`);
      }

      // CLOSE
      if (interaction.customId === "close_ticket") {

        const file = await createTranscript(interaction.channel);

        await interaction.channel.send({
          content: "📄 Transcript:",
          files: [file]
        });

        setTimeout(() => {
          interaction.channel.delete();
        }, 3000);
      }
    }
  }
};
