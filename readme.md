#to start the bot-api server you need to run the following command

```bash
docker run -d -p 8081:8081 --name=telegram-bot-api --restart=always -v telegram-bot-api-data:/var/lib/telegram-bot-api -e TELEGRAM_API_ID=<api_id> -e TELEGRAM_API_HASH=<api-hash> -e TELEGRAM_LOCAL=true aiogram/telegram-bot-api:latest
```

where:

- `api_id` - your api_id from https://my.telegram.org/apps
- `api-hash` - your api_hash from https://my.telegram.org/apps
