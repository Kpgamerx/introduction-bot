import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import OpenAI from 'openai';

const ai = new OpenAI({
  baseURL: process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.AI_API_KEY || ''
});

export default {
  data: new SlashCommandBuilder()
    .setName('ai-setup')
    .setDescription('AI-powered auto-configuration for Valorant server (Owner only)')
    .setDefaultMemberPermissions(0),
  async execute(interaction: any) {
    // Strict owner check
    if (interaction.user.id !== interaction.guild?.ownerId) {
      return interaction.reply({ 
        content: '❌ Only the server owner can use this command.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Gather context: top 15 text channels and top 15 roles
      const channels = (await interaction.guild.channels.fetch())
        .filter((c: any) => c.type === 0) // Text channels
        .first(15)
        .map((c: any) => ({ id: c.id, name: c.name }));

      const roles = (await interaction.guild.roles.fetch())
        .sort((a: any, b: any) => b.position - a.position)
        .first(15)
        .map((r: any) => ({ id: r.id, name: r.name }));

      if (channels.length === 0) {
        return interaction.editReply({ 
          content: '❌ No text channels found in this server.' 
        });
      }

      const channelList = channels.map((c: any) => `- ${c.name} (${c.id})`).join('\n');
      const roleList = roles.map((r: any) => `- ${r.name} (${r.id})`).join('\n');

      const prompt = `You are a Discord Server Manager for a Valorant gaming community. 
Analyze the following server context and suggest optimal configuration.

Available Text Channels:
${channelList}

Available Roles:
${roleList}

Return a STRICT JSON object with exactly these keys:
{
  "suggested_channel_id": "Must be one of the channel IDs above",
  "suggested_role_id": "Must be one of the role IDs above",
  "welcome_message": "Valorant themed welcome message, max 150 chars, use {user} and {guild} placeholders"
}

Rules:
- suggested_channel_id must be from the provided channel list
- suggested_role_id must be from the provided role list  
- welcome_message must be Valorant themed, under 150 characters
- Do not include any other text or explanation`;

      const response = await ai.chat.completions.create({
        model: process.env.AI_MODEL || 'qwen-plus',
        messages: [
          { role: 'system', content: 'You are a helpful Discord server configuration assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const aiResponse = response.choices[0].message.content;
      const config = JSON.parse(aiResponse || '{}');

      // Validate IDs exist in Discord cache
      const channel = await interaction.guild.channels.fetch(config.suggested_channel_id).catch(() => null);
      const role = await interaction.guild.roles.fetch(config.suggested_role_id).catch(() => null);

      if (!channel || !role) {
        return interaction.editReply({ 
          content: '❌ AI suggested invalid channel or role IDs. Please try again or use /setup manually.' 
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF4655')
        .setTitle('🎯 AI Configuration Suggestion')
        .setDescription('The AI has analyzed your server and suggests the following configuration:')
        .addFields(
          { name: '📝 Intro Channel', value: `<#${config.suggested_channel_id}>`, inline: true },
          { name: '🏷️ Intro Role', value: `<@&${config.suggested_role_id}>`, inline: true },
          { name: '💬 Welcome Message', value: config.welcome_message, inline: false }
        )
        .setFooter({ text: 'Review before applying' });

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`apply_ai_setup_${config.suggested_channel_id}_${config.suggested_role_id}`)
            .setLabel('✅ Apply Configuration')
            .setStyle(ButtonStyle.Success)
        );

      await interaction.editReply({ 
        content: '✨ AI Configuration Ready!', 
        embeds: [embed], 
        components: [row] 
      });

    } catch (error) {
      console.error('AI Setup error:', error);
      await interaction.editReply({ 
        content: '❌ Failed to generate AI configuration. Please try again or use /setup manually.' 
      });
    }
  }
};
