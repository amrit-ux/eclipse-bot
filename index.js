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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const setupData = {};
const config = {};
const claimed = {};

// ================= READY =================
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder().setName("setup").setDescription("Setup Ticket System"),
    new SlashCommandBuilder()
      .setName("rename")
      .setDescription("Rename ticket")
      .addStringOption(opt =>
        opt.setName("name").setDescription("New name").setRequired(true)
      )
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.guild) return;

  try {

    // ===== SETUP =====
    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "setup") {
        setupData[interaction.user.id] = {};

        const roleMenu = new RoleSelectMenuBuilder()
          .setCustomId("select_role")
          .setPlaceholder("Select Staff Role");

        return interaction.reply({
          content: "👨‍💼 Select Staff Role",
          components: [new ActionRowBuilder().addComponents(roleMenu)],
          flags: 64
        });
      }

      // ===== RENAME =====
      if (interaction.commandName === "rename") {
        const newName = interaction.options.getString("name");

        if (!interaction.channel.name.startsWith("ticket-"))
          return interaction.reply({ content: "❌ Not a ticket", flags: 64 });

        await interaction.channel.setName(newName);
        return interaction.reply({ content: "✅ Renamed", flags: 64 });
      }
    }

    // ===== ROLE SELECT =====
    if (interaction.isRoleSelectMenu()) {
      setupData[interaction.user.id].staff = interaction.values[0];

      const catMenu = new ChannelSelectMenuBuilder()
        .setCustomId("select_category")
        .setChannelTypes(ChannelType.GuildCategory);

      return interaction.update({
        content: "📁 Select Category",
        components: [new ActionRowBuilder().addComponents(catMenu)]
      });
    }

    // ===== CATEGORY =====
    if (interaction.isChannelSelectMenu() && interaction.customId === "select_category") {
      setupData[interaction.user.id].category = interaction.values[0];

      const confirm = new ButtonBuilder()
        .setCustomId("confirm_setup")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success);

      return interaction.update({
        content: "✅ Confirm Setup",
        components: [new ActionRowBuilder().addComponents(confirm)]
      });
    }

    // ===== CONFIRM =====
    if (interaction.isButton() && interaction.customId === "confirm_setup") {
      config[interaction.guild.id] = setupData[interaction.user.id];

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Create Ticket")
        .addOptions([{ label: "Support", value: "support" }]);

      await interaction.channel.send({
        content: "🎫 Open Ticket",
        components: [new ActionRowBuilder().addComponents(menu)]
      });

      delete setupData[interaction.user.id];

      return interaction.update({ content: "✅ Done", components: [] });
    }

    // ===== CREATE TICKET =====
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
      const data = config[interaction.guild.id];

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
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim").setLabel("Claim").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("close").setLabel("Close").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("transcript").setLabel("Transcript").setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ content: `👋 ${interaction.user}`, components: [row] });

      return interaction.reply({ content: "✅ Ticket Created", flags: 64 });
    }

    // ===== CLAIM =====
    if (interaction.isButton() && interaction.customId === "claim") {
      const data = config[interaction.guild.id];

      if (!interaction.member.roles.cache.has(data.staff))
        return interaction.reply({ content: "❌ Staff only", flags: 64 });

      claimed[interaction.channel.id] = interaction.user.id;

      await interaction.channel.send(`🛠️ Claimed by ${interaction.user}`);
      return interaction.reply({ content: "✅ Claimed", flags: 64 });
    }

    // ===== CLOSE =====
    if (interaction.isButton() && interaction.customId === "close") {
      const data = config[interaction.guild.id];

      if (!interaction.member.roles.cache.has(data.staff))
        return interaction.reply({ content: "❌ Staff only", flags: 64 });

      await interaction.reply("🔒 Closing...");

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }

    // ===== TRANSCRIPT =====
    if (interaction.isButton() && interaction.customId === "transcript") {

      const messages = await interaction.channel.messages.fetch({ limit: 100 });

      let html = `
      <html>
      <head>
      <style>
      body { background:#0d1117; color:white; font-family:sans-serif; }
      .msg { margin:10px; padding:10px; background:#161b22; border-radius:8px; }
      .user { color:#58a6ff; font-weight:bold; }
      </style>
      </head>
      <body>
      <h2>Ticket Transcript</h2>
      `;

      messages.reverse().forEach(m => {
        html += `<div class="msg"><span class="user">${m.author.tag}</span>: ${m.content}</div>`;
      });

      html += "</body></html>";

      const fs = require("fs");
      const file = `transcript-${interaction.channel.id}.html`;

      fs.writeFileSync(file, html);

      await interaction.reply({
        content: "📄 Transcript generated",
        files: [file]
      });
    }

  } catch (err) {
    console.log(err);
  }
});

client.login(TOKEN);
