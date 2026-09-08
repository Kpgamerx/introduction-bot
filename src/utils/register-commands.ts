import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import path from 'path';

export async function registerCommands() {
  const commands = [];
  const commandFiles = readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, '../commands', file);
    if (statSync(filePath).isDirectory()) continue;
    
    const command = await import(`../commands/${file}`);
    if (command.default && command.default.data) {
      commands.push(command.default.data.toJSON());
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN!);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commands }
    ) as any[];

    console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}
