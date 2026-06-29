const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.log("❌ ENV missing");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const setupData = {};
const config = {};

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup ticket system (R.O.T.I style)")
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Commands loaded");
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.guild) return;

  try {

    // ===== /setup =====
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "setup") {

        setupData[interaction.user.id] = {};

        const roleMenu = new RoleSelectMenuBuilder()
          .setCustomId("select_role")
          .setPlaceholder("Select Staff Role");

        return interaction.reply({
          content: "👨‍💼 Select staff role:",
          components: [new ActionRowBuilder().addComponents(roleMenu)],
          flags: 64
        });
      }
    }

    // ===== ROLE SELECT =====
    if (interaction.isRoleSelectMenu()) {

      setupData[interaction.user.id].staff = interaction.values[0];

      const catMenu = new ChannelSelectMenuBuilder()
        .setCustomId("select_category")
        .setPlaceholder("Select Category")
        .setChannelTypes(ChannelType.GuildCategory);

      return interaction.update({
        content: "📁 Select ticket category:",
        components: [new ActionRowBuilder().addComponents(catMenu)]
      });
    }

    // ===== CATEGORY SELECT =====
    if (interaction.isChannelSelectMenu() && interaction.customId === "select_category") {

      setupData[interaction.user.id].category = interaction.values[0];

      const logMenu = new ChannelSelectMenuBuilder()
        .setCustomId("select_logs")
        .setPlaceholder("Select Logs Channel (optional)")
        .setChannelTypes(ChannelType.GuildText);

      const skipBtn = new ButtonBuilder()
        .setCustomId("skip_logs")
        .setLabel("Skip Logs")
        .setStyle(ButtonStyle.Secondary);

      return interaction.update({
        content: "📜 Select logs channel or skip:",
        components: [
          new ActionRowBuilder().addComponents(logMenu),
          new ActionRowBuilder().addComponents(skipBtn)
        ]
      });
    }

    // ===== LOG SELECT =====
    if (interaction.isChannelSelectMenu() && interaction.customId === "select_logs") {

      setupData[interaction.user.id].logs = interaction.values[0];

      const confirm = new ButtonBuilder()
        .setCustomId("confirm_setup")
        .setLabel("✅ Confirm Setup")
        .setStyle(ButtonStyle.Success);

      return interaction.update({
        content: "✅ Confirm setup?",
        components: [new ActionRowBuilder().addComponents(confirm)]
      });
    }

    // ===== SKIP LOGS =====
    if (interaction.isButton() && interaction.customId === "skip_logs") {

      setupData[interaction.user.id].logs = null;

      const confirm = new ButtonBuilder()
        .setCustomId("confirm_setup")
        .setLabel("✅ Confirm Setup")
        .setStyle(ButtonStyle.Success);

      return interaction.update({
        content: "✅ Confirm setup?",
        components: [new ActionRowBuilder().addComponents(confirm)]
      });
    }

    // ===== CONFIRM =====
    if (interaction.isButton() && interaction.customId === "confirm_setup") {

      const data = setupData[interaction.user.id];

      config[interaction.guild.id] = data;

      // 🎫 PANEL AUTO SEND
      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("🎫 Create Ticket")
        .addOptions([
          { label: "Support", value: "support" },
          { label: "Billing", value: "billing" },
          { label: "Report", value: "report" }
        ]);

      await interaction.channel.send({
        content: "🎫 Create a ticket:",
        components: [new ActionRowBuilder().addComponents(menu)]
      });

      delete setupData[interaction.user.id];

      return interaction.update({
        content: "✅ Setup Complete & Panel Sent!",
        components: []
      });
    }

    // ===== CREATE TICKET =====
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {

      const data = config[interaction.guild.id];
      if (!data) return;

      await interaction.deferReply({ flags: 64 });

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: data.category,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          },
          {
            id: data.staff,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      const closeBtn = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close")
        .setStyle(ButtonStyle.Danger);

      await channel.send({
        content: `👋 ${interaction.user}`,
        components: [new ActionRowBuilder().addComponents(closeBtn)]
      });

      await interaction.editReply("✅ Ticket Created");
    }

    // ===== CLOSE =====
    if (interaction.isButton() && interaction.customId === "close_ticket") {

      await interaction.deferUpdate();

      await interaction.channel.send("🔒 Closing...");

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(TOKEN);
