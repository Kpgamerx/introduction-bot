import { SlashCommandBuilder } from 'discord.js';
import db from '../database';

export default {
  data: new SlashCommandBuilder()
    .setName('request-change')
    .setDescription('Request a change to your introduction (2 requests per month limit)'),
  async execute(interaction: any) {
    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get or create user's change request record
    let requestRecord: any = db.prepare('SELECT * FROM change_requests WHERE user_id = ? AND guild_id = ?').get(userId, guildId);

    if (!requestRecord) {
      // Create new record
      db.prepare('INSERT INTO change_requests (user_id, guild_id, request_count, last_reset_month) VALUES (?, ?, 0, ?)').run(userId, guildId, currentMonth);
      requestRecord = { request_count: 0, last_reset_month: currentMonth };
    }

    // Check if we need to reset the counter (new month)
    if (requestRecord.last_reset_month !== currentMonth) {
      db.prepare('UPDATE change_requests SET request_count = 0, last_reset_month = ? WHERE user_id = ? AND guild_id = ?').run(currentMonth, userId, guildId);
      requestRecord.request_count = 0;
    }

    // Check rate limit
    if (requestRecord.request_count >= 2) {
      return interaction.reply({ 
        content: '❌ You have already used your 2 change requests for this month. Please try again next month.', 
        ephemeral: true 
      });
    }

    // Increment the counter
    db.prepare('UPDATE change_requests SET request_count = request_count + 1 WHERE user_id = ? AND guild_id = ?').run(userId, guildId);

    const modal = {
      custom_id: 'change_modal',
      title: '📝 Request Introduction Change',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'change_description',
              label: 'What do you want to change?',
              style: 2,
              placeholder: 'Describe what you would like to update in your introduction...',
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
