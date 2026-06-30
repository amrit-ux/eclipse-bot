module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    // ❌ Ignore non slash commands
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      // ✅ IMPORTANT: prevent "Unknown interaction"
      await interaction.deferReply();

      // ✅ run command
      await command.execute(interaction);

    } catch (error) {
      console.error("❌ Command Error:", error);

      if (interaction.deferred) {
        await interaction.editReply("❌ Error while executing command");
      } else {
        await interaction.reply("❌ Error while executing command");
      }
    }
  },
};
