const fs = require("fs");

async function createTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  let html = `<html><body><h2>Transcript</h2>`;

  messages.reverse().forEach(msg => {
    html += `<p><b>${msg.author.tag}:</b> ${msg.content}</p>`;
  });

  html += "</body></html>";

  const file = `./transcript-${channel.id}.html`;
  fs.writeFileSync(file, html);

  return file;
}

module.exports = { createTranscript };
