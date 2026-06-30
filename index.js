require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB Connected");
});

require("./src/handlers/commandHandler")(client);
require("./src/handlers/eventHandler")(client);

client.login(process.env.TOKEN);
