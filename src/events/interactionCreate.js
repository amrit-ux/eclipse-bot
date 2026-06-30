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

if (interaction.customId === "claim_ticket") {
  interaction.channel.send(`Ticket claimed by ${interaction.user}`);
}
if (interaction.customId === "close_ticket") {

  if (!interaction.member.roles.cache.has("STAFF_ROLE_ID")) {
    return interaction.reply({ content: "Only Staff can close", ephemeral: true });
  }

  interaction.channel.delete();
}
