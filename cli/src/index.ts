import { Command } from 'commander';
import { logger } from './utils/logger.js';
import { logoutCommand } from './commands/logout.js';
import { loginCommand } from './commands/login.js';

const program = new Command();

program
  .name('envoy')
  .description('Envoy Vault CLI - Manage and inject secrets seamlessly')
  .version('1.0.0');

program.addCommand(loginCommand);
program.addCommand(logoutCommand);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);