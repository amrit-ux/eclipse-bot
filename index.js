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
  if (!interaction.guild) return;

  // CREATE TICKET
  if (interaction.customId === "create_ticket") {

    await interaction.deferReply({ ephemeral: true });

    // 🔥 prevent duplicate (using user ID)
    const existing = interaction.guild.channels.cache.find(
      ch => ch.topic === interaction.user.id
    );

    if (existing) {
      return interaction.editReply("❌ You already have an open ticket!");
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      topic: interaction.user.id, // 🔥 important
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

    await interaction.reply({
      content: "🔒 Closing ticket in 3 seconds...",
      ephemeral: true
    });

    setTimeout(async () => {
      if (interaction.channel) {
        await interaction.channel.delete().catch(console.error);
      }
    }, 3000);
  }
});

client.login(process.env.TOKEN);
