import { StartCommand } from './StartCommand.js';
import { SyncCommand } from './SyncCommand.js';
import { VacanciesCommand } from './VacanciesCommand.js';
import { WebAppCommand } from './WebAppCommand.js';
import { HelpCommand } from './HelpCommand.js';
import { MySubscriptionsCommand } from './MySubscriptionsCommand.js';

export class CommandManager {
  constructor() {
    this.commands = new Map();
    this.registerDefaultCommands();
  }

  registerCommand(command) {
    this.commands.set(command.commandName, command);
  }

  registerAll(bot) {
    for (const command of this.commands.values()) {
      command.register(bot);
    }
  }

  getAllHelp() {
    const helpLines = [];
    for (const command of this.commands.values()) {
      helpLines.push(command.getHelp());
    }
    return helpLines.join('\n');
  }

  registerDefaultCommands() {
    this.registerCommand(new StartCommand());
    this.registerCommand(new HelpCommand());
    this.registerCommand(new VacanciesCommand());
    this.registerCommand(new WebAppCommand());
    this.registerCommand(new MySubscriptionsCommand());
    this.registerCommand(new SyncCommand());
  }

  getCommand(commandName) {
    return this.commands.get(commandName);
  }
}
