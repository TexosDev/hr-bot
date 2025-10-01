import { BaseHandler } from '../middleware/BaseHandler.js';

export class BaseAction extends BaseHandler {
  constructor(actionPattern) {
    super();
    this.actionPattern = actionPattern;
  }

  register(bot) {
    bot.action(this.actionPattern, async (ctx) => {
      await this.validateAndExecute(ctx, () => this.execute(ctx));
    });
  }

  async execute(ctx) {
    throw new Error(`Метод execute должен быть переопределен в ${this.constructor.name}`);
  }

  extractParams(callbackData, prefix) {
    return callbackData.replace(prefix, '');
  }

  async handleSuccess(ctx, message) {
    await this.answerCallback(ctx, message);
  }

  async handleError(ctx, error, operation = 'действие') {
    await super.handleError(ctx, error, operation);
  }
}
