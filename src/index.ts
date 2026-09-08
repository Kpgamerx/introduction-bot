import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from './database';
import { readdirSync, statSync } from 'fs';
import path from 'path';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Dynamically load commands
const commands = new Map<string, any>();

async function loadCommands() {
  const commandFiles = readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, 'commands', file);
    if (statSync(filePath).isDirectory()) continue;
    
    const command = await import(`./commands/${file}`);
    if (command.default && command.default.data) {
      commands.set(command.default.data.name, command.default);
    }
  }
}

// Handle slash commands
client.on('interactionCreate', async (interaction: any) => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      const errorMessage = { content: '❌ An error occurred while executing this command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }

  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    try {
      switch (interaction.customId) {
        case 'setup_modal':
          await handleSetupModal(interaction);
          break;
        case 'ai_setup_modal':
          await handleAISetupModal(interaction);
          break;
        case 'valorant_intro_modal':
          await handleIntroModal(interaction);
          break;
        case 'change_modal':
          await handleChangeModal(interaction);
          break;
      }
    } catch (error) {
      console.error(`Error handling modal ${interaction.customId}:`, error);
      const errorMessage = { content: '❌ An error occurred while processing your request.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }

  // Handle button clicks
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('apply_ai_setup_')) {
      await handleApplyAISetup(interaction);
    }
    return;
  }
});

// Setup modal handler
async function handleSetupModal(interaction: any) {
  // Verify owner again
  if (interaction.user.id !== interaction.guild?.ownerId) {
    return interaction.reply({ 
      content: '❌ Only the server owner can use this command.', 
      ephemeral: true 
    });
  }

  const channelId = interaction.fields.getTextInputValue('intro_channel_id');
  const roleId = interaction.fields.getTextInputValue('intro_role_id').trim() || null;
  const welcomeMessage = interaction.fields.getTextInputValue('welcome_message');

  // Validate channel exists and is a text channel
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== 0) {
    return interaction.reply({ 
      content: '❌ Invalid channel ID. Please ensure it\'s a valid text channel.', 
      ephemeral: true 
    });
  }

  // Validate role if provided
  if (roleId) {
    const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      return interaction.reply({ 
        content: '❌ Invalid role ID. Please ensure it\'s a valid role.', 
        ephemeral: true 
      });
    }
  }

  // Save to database
  db.prepare(`
    INSERT OR REPLACE INTO guilds (guild_id, intro_channel_id, intro_role_id, welcome_message)
    VALUES (?, ?, ?, ?)
  `).run(interaction.guildId, channelId, roleId, welcomeMessage);

  await interaction.reply({ 
    content: `✅ Server configured successfully!\n📝 Intro Channel: <#${channelId}>\n🏷️ Intro Role: ${roleId ? `<@&${roleId}>` : 'Not set'}\n💬 Welcome message saved.`, 
    ephemeral: true 
  });
}

// AI Setup modal handler (not used but kept for completeness)
async function handleAISetupModal(interaction: any) {
  // This is handled via button, not modal
  await interaction.reply({ content: 'Please use the button to apply AI configuration.', ephemeral: true });
}

// Introduction modal handler
async function handleIntroModal(interaction: any) {
  const agent = interaction.fields.getTextInputValue('agent');
  const rank = interaction.fields.getTextInputValue('rank');
  const role = interaction.fields.getTextInputValue('role');
  const about = interaction.fields.getTextInputValue('about');

  // Check if server is configured
  const guildConfig: any = db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(interaction.guildId);
  
  if (!guildConfig || !guildConfig.intro_channel_id) {
    return interaction.reply({ 
      content: '❌ This server has not been configured yet.', 
      ephemeral: true 
    });
  }

  // Create Valorant-themed embed
  const embed = new EmbedBuilder()
    .setColor('#FF4655')
    .setTitle('🎯 New Agent Report')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: '🔫 Main Agent(s)', value: agent, inline: true },
      { name: '📊 Current Rank', value: rank, inline: true },
      { name: '🎭 Preferred Role', value: role, inline: true },
      { name: '📖 About Me / Playstyle', value: about, inline: false }
    )
    .setFooter({ text: `Agent: ${interaction.user.tag}` })
    .setTimestamp();

  // Send to intro channel
  const introChannel = await interaction.guild.channels.fetch(guildConfig.intro_channel_id).catch(() => null);
  if (!introChannel || introChannel.type !== 0) {
    return interaction.reply({ 
      content: '❌ The configured intro channel no longer exists or is invalid.', 
      ephemeral: true 
    });
  }

  const message = await introChannel.send({ embeds: [embed] });

  // Save introduction to database
  db.prepare(`
    INSERT OR REPLACE INTO introductions (user_id, guild_id, agent, rank, role, about, message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(interaction.user.id, interaction.guildId, agent, rank, role, about, message.id);

  // Assign intro role if configured
  if (guildConfig.intro_role_id) {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (member) {
      const role = await interaction.guild.roles.fetch(guildConfig.intro_role_id).catch(() => null);
      if (role) {
        await member.roles.add(role).catch(() => {});
      }
    }
  }

  // Format welcome message
  let welcomeText = guildConfig.welcomeMessage
    .replace(/{user}/g, `<@${interaction.user.id}>`)
    .replace(/{guild}/g, interaction.guild.name);

  await interaction.reply({ 
    content: `${welcomeText}\n\n✅ Your introduction has been posted!`, 
    ephemeral: true 
  });
}

// Change request modal handler
async function handleChangeModal(interaction: any) {
  const changeDescription = interaction.fields.getTextInputValue('change_description');

  // Get server owner
  const owner = await interaction.guild.fetchOwner().catch(() => null);
  if (!owner) {
    return interaction.reply({ 
      content: '❌ Could not fetch the server owner. Please try again later.', 
      ephemeral: true 
    });
  }

  // Create embed for the owner
  const embed = new EmbedBuilder()
    .setColor('#FF4655')
    .setTitle('📝 Introduction Change Request')
    .addFields(
      { name: '👤 User', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
      { name: '🆔 User ID', value: interaction.user.id, inline: true },
      { name: '📋 Requested Change', value: changeDescription, inline: false }
    )
    .setFooter({ text: `Guild: ${interaction.guild.name}` })
    .setTimestamp();

  // Try to DM the owner
  try {
    await owner.send({ embeds: [embed] });
    await interaction.reply({ 
      content: '✅ Your change request has been sent to the server owner.', 
      ephemeral: true 
    });
  } catch (error) {
    // Owner has DMs disabled
    await interaction.reply({ 
      content: '❌ The server owner has DMs disabled. Please contact them directly.', 
      ephemeral: true 
    });
  }
}

// Apply AI Setup button handler
async function handleApplyAISetup(interaction: any) {
  // Verify owner again
  if (interaction.user.id !== interaction.guild?.ownerId) {
    return interaction.reply({ 
      content: '❌ Only the server owner can apply this configuration.', 
      ephemeral: true 
    });
  }

  // Parse IDs from customId
  const parts = interaction.customId.split('_');
  const channelId = parts[3];
  const roleId = parts[4];

  // Validate channel exists and is a text channel
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== 0) {
    return interaction.reply({ 
      content: '❌ The suggested channel is no longer valid.', 
      ephemeral: true 
    });
  }

  // Validate role exists
  const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    return interaction.reply({ 
      content: '❌ The suggested role is no longer valid.', 
      ephemeral: true 
    });
  }

  // Get welcome message from the original embed
  const embed = interaction.message.embeds[0];
  const welcomeMessage = embed.fields.find((f: any) => f.name === '💬 Welcome Message')?.value || '';

  // Save to database
  db.prepare(`
    INSERT OR REPLACE INTO guilds (guild_id, intro_channel_id, intro_role_id, welcome_message)
    VALUES (?, ?, ?, ?)
  `).run(interaction.guildId, channelId, roleId, welcomeMessage);

  // Disable the button
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.customId)
        .setLabel('✅ Configuration Applied')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    );

  await interaction.update({ 
    content: '✅ Configuration applied successfully!', 
    components: [row] 
  });
}

// Initialize bot
async function main() {
  await loadCommands();
  
  client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user?.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
  });

  client.on('error', (error) => {
    console.error('Client error:', error);
  });

  await client.login(process.env.BOT_TOKEN);
}

main().catch(console.error);
