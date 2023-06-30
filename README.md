<p align="center">
<img src="./.github/assets/nimble.webp" alt="Nimble Logo" width="100" />
</p>

<p align="center">🤖 A Discord bot for Nimble Türkiye server developed using <a href="https://nestjs.com/">NestJS</a> and <a href="https://discord.js.org/">discord.js</a>.</p>

## Features

- Retrieve a curated list of questions that are answered in videos from a specific YouTube channel
- Perform a search for specific questions
- Listen to the answers to questions in a voice channel
- Watch the answers to the questions in a text channel

## Installation

1. Get a YouTube API Key at https://developers.google.com/youtube/v3/getting-started by creating a new project.

2. Get the bot's token at https://discord.com/developers/applications by creating a new application.

3. Install NPM packages

   ```sh
   npm install
   ```

4. Prepare the `.env` file

   ```JS
    BOT_TOKEN = YOUR-DISCORD-BOT-TOKEN
    YOUTUBE_API_KEY = YOUR-DISCORD-API-KEY
    YOUTUBE_CHANNEL_ID = YOUTUBE-CHANNEL-ID
    DATABASE_URI = MONGODB-URI
   ```

5. Start the project
   ```sh
   npm run start
   ```

## Contributing

1. Fork this repository.
2. Create a new branch with feature name.
3. Create your feature.
4. Commit and set commit message with feature name.
5. Push your code to your fork repository.
6. Create pull request.

## License

Nimble Discord Bot is [MIT licensed](https://github.com/canccevik/nimble-discord-bot/blob/master/LICENSE).
