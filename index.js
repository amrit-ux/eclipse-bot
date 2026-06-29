require("dotenv").config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content === '!hi') {
    message.reply('Hello 👋');
  }
});

client.login(process.env.TOKEN);
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

// COMMAND: !panel
client.on("messageCreate", async (message) => {
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

// BUTTON CLICK
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "create_ticket") {
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

    channel.send(`Hello ${interaction.user}, support will be with you shortly.`);
    interaction.reply({ content: "Ticket created!", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
