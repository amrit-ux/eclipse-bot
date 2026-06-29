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

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🧠 TEMP STORAGE (restart pe reset hoga)
const config = {};

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup ticket system")
    .addRoleOption(opt =>
      opt.setName("staff_role")
        .setDescription("Select staff role")
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("category")
        .setDescription("Ticket category")
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("logs")
        .setDescription("Logs channel")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Send ticket panel")

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Commands loaded");
})();

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {

  if (!interaction.guild) return;

  // ===== SETUP =====
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "setup") {

      const staff = interaction.options.getRole("staff_role");
      const category = interaction.options.getChannel("category");
      const logs = interaction.options.getChannel("logs");

      config[interaction.guild.id] = {
        staff: staff.id,
        category: category.id,
        logs: logs ? logs.id : null
      };

      return interaction.reply({
        content: "✅ Ticket system setup complete!",
        ephemeral: true
      });
    }

    // ===== PANEL =====
    if (interaction.commandName === "panel") {

      if (!config[interaction.guild.id]) {
        return interaction.reply({
          content: "❌ Run /setup first",
          ephemeral: true
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

    const data = config[interaction.guild.id];
    if (!data) return;

    const existing = interaction.guild.channels.cache.find(
      ch => ch.topic === interaction.user.id
    );

    if (existing) {
      return interaction.reply({
        content: "❌ Already have ticket",
        ephemeral: true
      });
    }

    await interaction.reply({ content: "⏳ Creating...", ephemeral: true });

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
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        },
        {
          id: data.staff,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const closeBtn = new ButtonBuilder()
      .setCustomId("close")
      .setLabel("🔒 Close")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeBtn);

    await channel.send({
      content: `👋 ${interaction.user} welcome!`,
      components: [row]
    });

    // LOG
    if (data.logs) {
      const logChannel = interaction.guild.channels.cache.get(data.logs);
      if (logChannel) {
        logChannel.send(`📥 Ticket created by ${interaction.user.tag}`);
      }
    }

    interaction.editReply("✅ Ticket created");
  }

  // ===== CLOSE =====
  if (interaction.isButton()) {

    const data = config[interaction.guild.id];

    if (interaction.customId === "close") {

      await interaction.reply("🔒 Ticket closed");

      if (data?.logs) {
        const logChannel = interaction.guild.channels.cache.get(data.logs);
        if (logChannel) {
          logChannel.send(`🔒 Closed by ${interaction.user.tag}`);
        }
      }

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }
  }

});

client.login(process.env.TOKEN);
