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
  Routes,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ===== DATABASE =====
const dbFile = "./data.json";
let db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder().setName("setup").setDescription("Setup Ticket"),
    new SlashCommandBuilder()
      .setName("rename")
      .setDescription("Rename Ticket")
      .addStringOption(o => o.setName("name").setRequired(true)),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
});

// ===== INTERACTIONS =====
client.on("interactionCreate", async (i) => {
  if (!i.guild) return;

  try {

    // ===== SETUP =====
    if (i.isChatInputCommand() && i.commandName === "setup") {

      const roleMenu = new RoleSelectMenuBuilder()
        .setCustomId("role")
        .setPlaceholder("Select Staff Role");

      return i.reply({
        content: "Select Staff Role",
        components: [new ActionRowBuilder().addComponents(roleMenu)],
        flags: 64
      });
    }

    // ===== RENAME =====
    if (i.isChatInputCommand() && i.commandName === "rename") {
      if (!i.channel.name.startsWith("ticket-"))
        return i.reply({ content: "Not a ticket", flags: 64 });

      await i.channel.setName(i.options.getString("name"));
      return i.reply({ content: "Renamed", flags: 64 });
    }

    // ===== ROLE SELECT =====
    if (i.isRoleSelectMenu()) {
      db[i.guild.id] = { staff: i.values[0], count: 0 };
      saveDB();

      const panel = new StringSelectMenuBuilder()
        .setCustomId("panel")
        .setPlaceholder("Create Ticket")
        .addOptions([
          { label: "Support", value: "support" },
          { label: "Billing", value: "billing" }
        ]);

      return i.update({
        content: "Setup Done",
        components: [new ActionRowBuilder().addComponents(panel)]
      });
    }

    // ===== CREATE =====
    if (i.isStringSelectMenu() && i.customId === "panel") {

      const data = db[i.guild.id];
      if (!data) return;

      // cooldown
      if (db[`cool_${i.user.id}`] && Date.now() - db[`cool_${i.user.id}`] < 5000)
        return i.reply({ content: "Wait before creating ticket", flags: 64 });

      db[`cool_${i.user.id}`] = Date.now();

      data.count++;
      saveDB();

      const name = `ticket-${String(data.count).padStart(3, "0")}`;

      const ch = await i.guild.channels.create({
        name,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
          { id: data.staff, allow: [PermissionsBitField.Flags.ViewChannel] }
        ]
      });

      db[ch.id] = { owner: i.user.id, claimed: null };
      saveDB();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim").setLabel("Claim").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("close").setLabel("Close").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("transcript").setLabel("Transcript").setStyle(ButtonStyle.Secondary)
      );

      await ch.send({
        embeds: [new EmbedBuilder().setTitle("Ticket Opened").setDescription(`User: <@${i.user.id}>`)],
        components: [row]
      });

      return i.reply({ content: "Ticket Created", flags: 64 });
    }

    // ===== CLAIM =====
    if (i.isButton() && i.customId === "claim") {
      const data = db[i.guild.id];
      if (!i.member.roles.cache.has(data.staff))
        return i.reply({ content: "Staff only", flags: 64 });

      db[i.channel.id].claimed = i.user.id;
      saveDB();

      return i.reply(`Claimed by ${i.user}`);
    }

    // ===== CLOSE =====
    if (i.isButton() && i.customId === "close") {
      const data = db[i.guild.id];
      const ticket = db[i.channel.id];

      if (!i.member.roles.cache.has(data.staff))
        return i.reply({ content: "Staff only", flags: 64 });

      if (ticket.claimed && ticket.claimed !== i.user.id)
        return i.reply({ content: "Only claimer can close", flags: 64 });

      await i.reply("Closing...");

      setTimeout(() => i.channel.delete().catch(() => {}), 3000);
    }

    // ===== TRANSCRIPT =====
    if (i.isButton() && i.customId === "transcript") {

      const msgs = await i.channel.messages.fetch({ limit: 100 });

      let html = `
      <html><body style="background:#0d1117;color:white;">
      <h2>Transcript</h2>
      `;

      msgs.reverse().forEach(m => {
        html += `<p><b>${m.author.tag}:</b> ${m.content}</p>`;
      });

      html += "</body></html>";

      const file = `transcript-${i.channel.id}.html`;
      fs.writeFileSync(file, html);

      return i.reply({ files: [file] });
    }

  } catch (e) {
    console.log(e);
  }
});

client.login(TOKEN);
