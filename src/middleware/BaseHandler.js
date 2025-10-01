export class BaseHandler {
  constructor() {
    this.name = this.constructor.name;
  }

  isPrivateChat(ctx) {
    return ctx.chat.type === 'private';
  }

  isAdmin(ctx) {
    const adminId = parseInt(process.env.ADMIN_CHAT_ID);
    return ctx.from.id === adminId;
  }

  async handleError(ctx, error, operation = 'операция') {
    console.error(`❌ Ошибка ${operation}:`, error);
    
    const errorMessage = `❌ Ошибка ${operation}. Попробуйте позже.`;
    
    try {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery(errorMessage);
      } else {
        await ctx.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('❌ Ошибка отправки сообщения об ошибке:', replyError);
    }
  }

  async answerCallback(ctx, message, showAlert = false) {
    await ctx.answerCbQuery(message, { show_alert: showAlert });
  }

  async validateAndExecute(ctx, operation) {
    if (!this.isPrivateChat(ctx)) {
      return;
    }

    if (!ctx.from || !ctx.from.id) {
      console.warn('⚠️ Отсутствует информация о пользователе');
      return;
    }

    try {
      await operation();
    } catch (error) {
      await this.handleError(ctx, error, this.name);
    }
  }
}
