const { 
  Client, 
  GatewayIntentBits, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  ChannelType, 
  PermissionsBitField 
} = require('discord.js');

require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// ================= COMMAND =================
client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!panel') {

    const button = new ButtonBuilder()
      .setCustomId("create_ticket")
      .setLabel("🎫 Create Ticket")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    message.channel.send({
      content: "🎫 Click below to create a ticket",
      components: [row]
    });
  }
});

// ================= BUTTON SYSTEM =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.guild) return;

  try {

    // ========= CREATE TICKET =========
    if (interaction.customId === "create_ticket") {

      // ✅ check duplicate FIRST (no defer)
      const existing = interaction.guild.channels.cache.find(
        ch => ch.topic === interaction.user.id
      );

      if (existing) {
        return interaction.reply({
          content: "❌ You already have an open ticket!",
          ephemeral: true
        });
      }

      // ✅ instant reply (prevents unknown interaction)
      await interaction.reply({
        content: "⏳ Creating your ticket...",
        ephemeral: true
      });

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        topic: interaction.user.id,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      const closeBtn = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeBtn);

      await channel.send({
        content: `👋 Hello ${interaction.user}\nSupport will be with you shortly.`,
        components: [row]
      });

      // ✅ update reply instead of new reply
      await interaction.editReply("✅ Your ticket has been created!");
    }

    // ========= CLOSE TICKET =========
    if (interaction.customId === "close_ticket") {

      await interaction.reply({
        content: "🔒 Closing ticket in 2 seconds...",
        ephemeral: true
      });

      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 2000);
    }

  } catch (err) {
    console.error("❌ Error:", err);

    if (!interaction.replied) {
      interaction.reply({
        content: "⚠️ Something went wrong!",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);
