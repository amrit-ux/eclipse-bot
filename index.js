const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionsBitField } = require('discord.js');
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

// COMMANDS
client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!hi') {
    message.reply('Hello 👋');
  }

  if (message.content === "!panel") {
    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("🎫 Create Ticket")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content: "Click to create a ticket",
      components: [row]
    });
  }
});

// BUTTON SYSTEM
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // CREATE TICKET
  if (interaction.customId === "create_ticket") {

    // 🔥 PREVENT DUPLICATE
    const existing = interaction.guild.channels.cache.find(
      ch => ch.name === `ticket-${interaction.user.username}`
    );

    if (existing) {
      return interaction.reply({
        content: "❌ You already have an open ticket!",
        ephemeral: true
      });
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

    await interaction.reply({
      content: "✅ Ticket created!",
      ephemeral: true
    });
  }

  // CLOSE TICKET
  if (interaction.customId === "close_ticket") {
    await interaction.reply({
      content: "🔒 Closing ticket in 3 seconds...",
      ephemeral: true
    });

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

client.login(process.env.TOKEN);
