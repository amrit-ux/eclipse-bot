if (interaction.isButton()) {
  if (interaction.customId === "create_ticket") {
    
    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: 0,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ["ViewChannel"]
        },
        {
          id: interaction.user.id,
          allow: ["ViewChannel"]
        }
      ]
    });

    await channel.send(`Welcome ${interaction.user}`);

    interaction.reply({ content: `Created: ${channel}`, ephemeral: true });
  }
}
