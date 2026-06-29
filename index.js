const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ================= PANEL COMMAND =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!panel") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("🎫 Select ticket type")
      .addOptions([
        {
          label: "Support",
          description: "Get help from support team",
          value: "support"
        },
        {
          label: "Billing",
          description: "Payment / billing issues",
          value: "billing"
        },
        {
          label: "Report",
          description: "Report a user",
          value: "report"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({
      content: "🎫 **Create a Ticket**\nSelect category below:",
      components: [row]
    });
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.guild) return;

  try {

    // ========= SELECT MENU =========
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId !== "ticket_menu") return;

      const choice = interaction.values[0];

      // prevent duplicate
      const existing = interaction.guild.channels.cache.find(
        ch => ch.topic === interaction.user.id
      );

      if (existing) {
        return interaction.reply({
          content: "❌ You already have an open ticket!",
          ephemeral: true
        });
      }

      await interaction.reply({
        content: "⏳ Creating ticket...",
        ephemeral: true
      });

      const channel = await interaction.guild.channels.create({
        name: `${choice}-${interaction.user.username}`,
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
        .setLabel("🔒 Close")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeBtn);

      await channel.send({
        content: `👋 Hello ${interaction.user}\nCategory: **${choice}**\nPlease explain your issue.`,
        components: [row]
      });

      await interaction.editReply("✅ Ticket created!");
    }

    // ========= CLOSE =========
    if (interaction.isButton()) {

      if (interaction.customId === "close_ticket") {

        const deleteBtn = new ButtonBuilder()
          .setCustomId("delete_ticket")
          .setLabel("🗑 Delete")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(deleteBtn);

        await interaction.reply({
          content: "🔒 Ticket closed. Staff will review.\nClick below to delete.",
          components: [row]
        });
      }

      if (interaction.customId === "delete_ticket") {

        await interaction.reply({
          content: "🗑 Deleting ticket...",
          ephemeral: true
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 2000);
      }
    }

  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      interaction.reply({
        content: "⚠️ Error occurred",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);
