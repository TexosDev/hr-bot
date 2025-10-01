import { BaseHandler } from '../middleware/BaseHandler.js';

export class BaseCommand extends BaseHandler {
  constructor(commandName) {
    super();
    this.commandName = commandName;
  }

  register(bot) {
    bot.command(this.commandName, async (ctx) => {
      await this.validateAndExecute(ctx, () => this.execute(ctx));
    });
  }

  async execute(ctx) {
    throw new Error(`Метод execute должен быть переопределен в ${this.constructor.name}`);
  }

  getHelp() {
    return `/${this.commandName} - ${this.getDescription()}`;
  }

  getDescription() {
    return 'Описание команды';
  }
}
