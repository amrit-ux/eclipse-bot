client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // CREATE TICKET
  if (interaction.customId === "create_ticket") {

    await interaction.deferReply({ ephemeral: true });

    const existing = interaction.guild.channels.cache.find(
      ch => ch.name === `ticket-${interaction.user.username}`
    );

    if (existing) {
      return interaction.editReply("❌ You already have an open ticket!");
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const closeBtn = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 Close Ticket")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeBtn);

    await channel.send({
      content: `Hello ${interaction.user}, support will be with you shortly.`,
      components: [row]
    });

    await interaction.editReply("✅ Ticket created!");
  }

  // CLOSE TICKET
  if (interaction.customId === "close_ticket") {

    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply("🔒 Closing ticket in 3 seconds...");

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});
