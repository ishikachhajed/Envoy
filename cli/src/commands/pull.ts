import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { listSecrets } from '../services/secretService.js';
import { ensureOrganization, ensureProject, ensureEnvironment } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
export const pullCommand = new Command('pull')
  .description('Download environment secrets and save them to a .env file')
  .option('-f, --file <path>', 'Output file path', '.env')
  .action(async (options) => {
    try {
      const orgId = await ensureOrganization();
      const projectId = await ensureProject();
      const envId = await ensureEnvironment();
      logger.info('Fetching secrets for pull...');
      const secrets = await listSecrets(envId);
      if (secrets.length === 0) {
        logger.warn('No secrets found in this environment to pull.');
        return;
      }
      // Convert the secrets array into standard .env format
      const envLines = secrets.map(secret => `${secret.key}=${secret.value}`);
      const envContent = envLines.join('\n') + '\n';
      
      const targetPath = path.resolve(process.cwd(), options.file);
      fs.writeFileSync(targetPath, envContent, 'utf-8');
      
      logger.success(`Successfully pulled ${secrets.length} secrets into '${options.file}'`);
      
      // Warn the user if they lack Admin access and received masked keys
      const hasMasked = secrets.some(s => s.value === '••••••••••••');
      if (hasMasked) {
        logger.warn('Notice: Because your role is MEMBER, the secrets were safely masked in the .env file. Ask an Admin if you need raw values.');
      }
    } catch (error) {
      logger.error('Failed to pull secrets', error);
      process.exit(1);
    }
  });