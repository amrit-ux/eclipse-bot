const fs = require("fs");

module.exports = (client) => {
  const folders = fs.readdirSync("./src/commands");

  for (const folder of folders) {
    const files = fs
      .readdirSync(`./src/commands/${folder}`)
      .filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const command = require(`../commands/${folder}/${file}`);

      // ✅ SAFE LOAD
      if (!command.data || !command.execute) {
        console.log(`❌ Skipped ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded ${command.data.name}`);
    }
  }
};
