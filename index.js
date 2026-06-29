const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

require("dotenv").config();

// ✅ SAFE ENV CHECK
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
  console.log("❌ TOKEN missing");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.log("❌ CLIENT_ID missing");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const config = {};

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const commands = [
      new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Setup ticket system")
        .addRoleOption(opt =>
          opt.setName("staff_role").setDescription("Staff role").setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName("category").setDescription("Category").setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName("logs").setDescription("Logs").setRequired(false)
        ),

      new SlashCommandBuilder()
        .setName("panel")
        .setDescription("Send ticket panel")
    ].map(c => c.toJSON());

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    // ⚡ FAST REGISTER (guild-based)
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Command error:", err);
  }
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.guild) return;

  try {

    // ===== COMMANDS =====
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "setup") {

        const staff = interaction.options.getRole("staff_role");
        const category = interaction.options.getChannel("category");
        const logs = interaction.options.getChannel("logs");

        config[interaction.guild.id] = {
          staff: staff.id,
          category: category.id,
          logs: logs?.id || null
        };

        return interaction.reply({
          content: "✅ Setup complete!",
          flags: 64
        });
      }

      if (interaction.commandName === "panel") {

        if (!config[interaction.guild.id]) {
          return interaction.reply({
            content: "❌ Run /setup first",
            flags: 64
          });
        }

        const menu = new StringSelectMenuBuilder()
          .setCustomId("ticket_menu")
          .setPlaceholder("🎫 Select category")
          .addOptions([
            { label: "Support", value: "support" },
            { label: "Billing", value: "billing" },
            { label: "Report", value: "report" }
          ]);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
          content: "🎫 Create a ticket:",
          components: [row]
        });
      }
    }

    // ===== CREATE TICKET =====
    if (interaction.isStringSelectMenu()) {

      if (interaction.customId !== "ticket_menu") return;

      const data = config[interaction.guild.id];
      if (!data) return;

      await interaction.deferReply({ flags: 64 });

      const existing = interaction.guild.channels.cache.find(
        ch => ch.topic === interaction.user.id
      );

      if (existing) {
        return interaction.editReply("❌ Already have ticket");
      }

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: data.category,
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
          },
          {
            id: data.staff,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      const btn = new ButtonBuilder()
        .setCustomId("close")
        .setLabel("🔒 Close")
        .setStyle(ButtonStyle.Danger);

      await channel.send({
        content: `👋 ${interaction.user}`,
        components: [new ActionRowBuilder().addComponents(btn)]
      });

      if (data.logs) {
        interaction.guild.channels.cache
          .get(data.logs)
          ?.send(`📥 Ticket by ${interaction.user.tag}`);
      }

      await interaction.editReply("✅ Ticket created");
    }

    // ===== CLOSE =====
    if (interaction.isButton()) {

      if (interaction.customId === "close") {

        await interaction.deferUpdate();

        await interaction.channel.send("🔒 Closing...");

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);
      }
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
