require("dotenv").config();

const { REST } = require("@discordjs/rest")
const {GatewayIntentBits, Routes} = require("discord-api-types/v10")
const { Client, Intents, Collection} = require("discord.js");
const { Player } = require("discord-player");

const fs = require("node:fs");
const path = require("node:path");

//Creating Discord Bingus bot

const client = new Client({
  intents: [GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates]
});

//Loading commands
const commands = [];
client.commands = new Collection();

//Pulling command files from commands folder
const commandsPath = path.join(__dirname, "/src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));


//Applying these commands to the client (discord bot)
for (const file of commandFiles){
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  console.log(file);
  console.log(filePath);
  console.log(command.data.name);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

client.player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25
  }
});

client.on("ready", () => {
  const guild_ids = client.guilds.cache.map(guild => guild.id);

  const rest = new REST({version: "9"}).setToken(process.env.TOKEN);
  for (const guildID of guild_ids){
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildID), {
      body: commands
    })
    .then(() => console.log(`Added commands to ${guildID}`)).catch(console.error);
  }

  console.log("Client is ready.");
});

client.on("interactionCreate", async interaction => {
  if(!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if(!command) return;

  try{
    await command.execute({client, interaction});
  }
  catch(err){
    console.log(err);
    await interaction.reply("An error occuring while executing that command.");
  }
});

client.login(process.env.TOKEN);

//Glitch's fastify package works instead of using express
// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Our main GET home page route, pulls from src/pages/index.hbs
fastify.get("/", function (request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = {
    greeting: "Bingus Operational.",
  };
  // request.query.paramName <-- a querystring example
  return reply.view("/src/pages/index.hbs", params);
});

// A POST route to handle form submissions
fastify.post("/", function (request, reply) {
  let params = {
    greeting: "Hello Form!",
  };
  // request.body.paramName <-- a form post example
  return reply.view("/src/pages/index.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
