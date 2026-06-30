const { SlashCommandBuilder } = require("discord.js");
const { createTranscript } = require("../../utils/transcript");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("transcript")
    .setDescription("Generate transcript"),

  async execute(interaction) {
    const file = await createTranscript(interaction.channel);

    await interaction.reply({
      content: "📄 Transcript:",
      files: [file],
    });
  },
};
