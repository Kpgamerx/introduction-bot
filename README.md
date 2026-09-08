██╗  ██╗██╗   ██╗██╗  ██╗██╗  ██╗
██║ ██╔╝██║   ██║╚██╗██╔╝ ╚██╗██╔╝
█████╔╝ ██║   ██║  ╚███╔╝  ╚███╔╝ 
██╔═██╗ ╚██╗ ██╔╝  ██╔██╗  ██╔██╗ 
██║  ██╗  ╚████╔╝  ██╔╝ ██╗██╔╝ ██╗
╚═╝  ╚═╝   ╚═══╝   ╚═╝  ╚═╝╚═╝  ╚═╝
                                    
      V A L O R A N T   B O T

A feature-rich, AI-powered Discord bot built specifically for the **kvhx** Valorant community. It handles member onboarding, server configuration, and live activity tracking with a sleek, gaming-focused UI.

## ⚡ Key Features

- 🛡️ **Owner-Only Setup:** Secure manual configuration or let **Qwen AI** auto-configure your server channels and roles.
- 🎮 **Valorant Intros:** Custom modals for members to share their Main Agent, Rank, and Role.
- 🔄 **Strict Rate Limiting:** Members can only request profile changes **2 times per month**. Requests are sent directly to the owner's DMs.
- 📊 **Live Voice Stats:** Dynamically renames a voice channel to show live stats (e.g., `🔴 5 Playing Valorant | 🟢 12 In Voice`).
- 🤖 **AI Integration:** Powered by Qwen 2.5 for smart server analysis and tactical community features.

## 🛠️ Tech Stack

- **Runtime:** Node.js / TypeScript
- **Framework:** Discord.js v14
- **Database:** SQLite (`better-sqlite3`)
- **AI Engine:** Qwen 2.5 (via OpenRouter / DashScope)

## 🚀 Quick Start

**1. Clone and install dependencies:**
```bash
git clone https://github.com/kvhx/valorant-intro-bot.git
cd valorant-intro-bot
npm install
```

**2. Configure your environment:**
Create a `.env` file in the root directory and add your keys:
```env
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_id
AI_API_KEY=your_qwen_api_key
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=qwen/qwen-2.5-72b-instruct
```

**3. Build, deploy, and run:**
```bash
npm run build
npm run deploy   # Registers slash commands
npm start        # Starts the bot
```

## ⚙️ First Steps in Discord

1. Ensure the bot has `Administrator` permissions (or specific channel/role management permissions).
2. As the **Server Owner**, run `/setup` or `/ai-setup` to configure the introduction channels and roles.
3. Members can now use `/introduce` to join the roster!

---

<p align="center">
  <b>Built with ❤️ for the kvhx community</b><br>
  <i>"I am the beginning. I am the end." — Omen</i>
</p>
