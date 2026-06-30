require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync("./src/commands/ticket").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/ticket/${file}`);
  client.commands.set(command.data.name, command);
}

// Event
client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (cmd) await cmd.execute(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === "create_ticket") {
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0,
      });

      await channel.send({
        content: `Welcome ${interaction.user}`,
        components: [{
          type: 1,
          components: [
            { type: 2, label: "Claim", style: 2, custom_id: "claim_ticket" },
            { type: 2, label: "Close", style: 4, custom_id: "close_ticket" }
          ]
        }]
      });

      await interaction.reply({ content: "Ticket created!", ephemeral: true });
    }

    if (interaction.customId === "claim_ticket") {
      await interaction.reply({ content: "You claimed this ticket", ephemeral: true });
    }

    if (interaction.customId === "close_ticket") {
      await interaction.channel.delete();
    }
  }
});

client.login(process.env.TOKEN);
