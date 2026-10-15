const { Client, GatewayIntentBits } = require("discord.js");

const token = process.env.DISCORD_BOT_TOKEN;
const prefix = process.env.COMMAND_PREFIX || "!";

if (!token) {
  console.error("[FATAL] DISCORD_BOT_TOKEN environment variable is not defined.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[READY] Logged in as ${client.user.tag}`);
  console.log(`[INFO] Command prefix is set to '${prefix}'`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    const latency = Date.now() - message.createdTimestamp;
    await message.reply(`Pong! Gateway latency: ${latency}ms (API: ${Math.round(client.ws.ping)}ms)`);
  }
});

// Graceful container termination
const handleShutdown = (signal) => {
  console.log(`[SHUTDOWN] Received ${signal}. Destroying client and exiting...`);
  client.destroy();
  process.exit(0);
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

client.login(token);
