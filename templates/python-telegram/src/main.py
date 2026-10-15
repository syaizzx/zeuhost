import os
import sys
import logging
import signal
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("zeuhost-telegram-bot")

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    logger.error("FATAL: TELEGRAM_BOT_TOKEN environment variable is not defined.")
    sys.exit(1)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_first_name = update.effective_user.first_name if update.effective_user else "Teman"
    await update.message.reply_text(
        f"Halo {user_first_name}! Bot ini berjalan online 24 jam di server cloud ZeuHost.\n"
        "Ketik /ping untuk tes kecepatan respon."
    )

async def ping_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Pong! Bot online dan responsif 24/7.")

def main():
    logger.info("Starting Telegram bot engine...")
    app = ApplicationBuilder().token(TOKEN).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("ping", ping_command))

    def handle_signal(sig, frame):
        logger.info("Received termination signal %s. Shutting down cleanly...", sig)
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    app.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
