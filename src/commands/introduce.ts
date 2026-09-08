import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database';

export default {
  data: new SlashCommandBuilder()
    .setName('introduce')
    .setDescription('Submit your Valorant introduction to the server'),
  async execute(interaction: any) {
    // Check if server is configured
    const guildConfig: any = db.prepare('SELECT * FROM guilds WHERE guild_id = ?').get(interaction.guildId);
    
    if (!guildConfig || !guildConfig.intro_channel_id) {
      return interaction.reply({ 
        content: '❌ This server has not been configured yet. Please ask the owner to run /setup or /ai-setup first.', 
        ephemeral: true 
      });
    }

    const modal = {
      custom_id: 'valorant_intro_modal',
      title: '🎯 Valorant Introduction',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'agent',
              label: 'Main Agent(s)',
              style: 1,
              placeholder: 'e.g., Jett, Reyna, Omen',
              required: true,
              min_length: 1,
              max_length: 100
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'rank',
              label: 'Current Rank',
              style: 1,
              placeholder: 'e.g., Diamond 2, Ascendant 1',
              required: true,
              min_length: 1,
              max_length: 50
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'role',
              label: 'Preferred Role',
              style: 1,
              placeholder: 'e.g., Duelist, Controller, Sentinel',
              required: true,
              min_length: 1,
              max_length: 50
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'about',
              label: 'About Me / Playstyle',
              style: 2,
              placeholder: 'Tell us about yourself and how you play!',
              required: true,
              min_length: 10,
              max_length: 1000
            }
          ]
        }
      ]
    };

    await interaction.showModal(modal);
  }
};
