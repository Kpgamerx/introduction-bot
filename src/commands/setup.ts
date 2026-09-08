import { SlashCommandBuilder } from 'discord.js';
import db from '../database';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Manually configure the server for Valorant introductions (Owner only)')
    .setDefaultMemberPermissions(0),
  async execute(interaction: any) {
    // Strict owner check
    if (interaction.user.id !== interaction.guild?.ownerId) {
      return interaction.reply({ 
        content: '❌ Only the server owner can use this command.', 
        ephemeral: true 
      });
    }

    const modal = {
      custom_id: 'setup_modal',
      title: 'Server Configuration',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'intro_channel_id',
              label: 'Intro Channel ID',
              style: 1,
              placeholder: 'Enter the channel ID for introductions',
              required: true,
              min_length: 17,
              max_length: 20
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'intro_role_id',
              label: 'Intro Role ID (Optional)',
              style: 1,
              placeholder: 'Enter the role ID to assign on intro',
              required: false,
              min_length: 17,
              max_length: 20
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'welcome_message',
              label: 'Welcome Message',
              style: 2,
              placeholder: 'Use {user} and {guild} placeholders',
              required: true,
              min_length: 10,
              max_length: 500
            }
          ]
        }
      ]
    };

    await interaction.showModal(modal);
  }
};
