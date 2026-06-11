import { Command } from 'commander';
import spawn from 'cross-spawn';
import { listSecrets } from '../services/secretService.js';
import { ensureOrganization, ensureProject, ensureEnvironment } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
export const runCommand = new Command('run')
  .description('Inject secrets directly into a process in memory')
  .argument('<command...>', 'The command and its arguments to run (e.g., "npm run dev")')
  .action(async (commandArgs: string[]) => {
    try {
      let secrets: any[] = [];

      if (process.env.ENVOY_TOKEN) {
        logger.info('ENVOY_TOKEN detected. Fetching secrets via Service Token...');
        const { listSecretsForServiceToken } = await import('../services/secretService.js');
        secrets = await listSecretsForServiceToken();
      } else {
        const orgId = await ensureOrganization();
        const projectId = await ensureProject();
        const envId = await ensureEnvironment();
        logger.info('Fetching secrets for injection...');
        secrets = await listSecrets(envId);
      }

      // We cannot inject masked values into a real process, it would break the application.
      const hasMasked = secrets.some(s => s.value === '••••••••••••');
      if (hasMasked) {
        logger.error('Cannot inject masked secrets into a process! You must have ADMIN privileges to decrypt secrets into memory.');
        process.exit(1);
      }
      // Prepare the injected environment map
      const injectedEnv: Record<string, string> = {};
      secrets.forEach(secret => {
        if (secret.value) {
          injectedEnv[secret.key] = secret.value;
        }
      });
      // Merge existing system process.env with our new secrets
      const envMap = { ...process.env, ...injectedEnv };
      const [cmd, ...args] = commandArgs;
      if (!cmd) {
        logger.error('No command provided to run.');
        process.exit(1);
      }
      logger.success(`Injecting ${secrets.length} secrets and starting process: ${cmd} ${args.join(' ')}\n`);
      // Spawn the child process
      const childProcess = spawn(cmd, args, {
        env: envMap as NodeJS.ProcessEnv,
        stdio: 'inherit',
      });
      childProcess.on('error', (err: Error) => {
        logger.error(`Failed to start process: ${cmd}`, err);
      });
      childProcess.on('exit', (code: number | null) => {
        if (code !== null) {
          process.exit(code);
        }
      });
    } catch (error) {
      logger.error('Failed to run process', error);
      process.exit(1);
    }
  });