import { Command } from 'commander';
import { loadConfig, clearConfig } from '../storage/configStore.js';
import { logger } from '../utils/logger.js';

export const logoutCommand = new Command('logout')
  .description('Logout from Envoy Vault')
  .action(() => {
    const config = loadConfig();

    if (!config.token) {
      logger.info('No active session found.');
      return;
    }

    clearConfig();

    logger.success(
      'Successfully logged out! Local configuration cleared.'
    );
  });