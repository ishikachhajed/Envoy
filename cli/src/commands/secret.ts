import { Command } from 'commander';
import prompts from 'prompts';
import { listSecrets, createSecret, revealSecret, deleteSecret } from '../services/secretService.js';
import { ensureOrganization, ensureProject, ensureEnvironment } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

export const secretCommand = new Command('secret')
  .description('Manage Envoy Vault secrets');

const ensureEnvContext = async () => {
  await ensureOrganization();
  await ensureProject();
  const envId = await ensureEnvironment();
  return envId;
};

secretCommand
  .command('list')
  .description('List all secrets in the active environment (masked)')
  .action(async () => {
    try {
      const envId = await ensureEnvContext();
      logger.info('Fetching secrets...');
      const secrets = await listSecrets(envId);
     
      
      if (secrets.length === 0) {
        logger.warn('No secrets found in this environment.');
        return;
      }

      logger.success('Secrets:');
      secrets.forEach((secret, index) => {
        console.log(
  `  ${index + 1}. ${secret.key} = ${secret.value} (ID: ${secret.id})`
);
      });
    } catch (error) {
      logger.error('Failed to fetch secrets', error);
      process.exit(1);
    }
  });

secretCommand
  .command('get')
  .description('Reveal the decrypted value of a specific secret')
  .action(async () => {
    try {
      const { secretId } = await prompts({
        type: 'text',
        name: 'secretId',
        message: 'Enter the Secret ID to reveal:',
        validate: (value: string) => (value.trim().length > 0 ? true : 'Secret ID cannot be empty'),
      });

      if (!secretId) process.exit(1);

      logger.info(`Decrypting secret...`);
      const secret = await revealSecret(secretId);
      logger.success(`Decrypted Value for ${secret.key}:`);
      console.log(`\n  ${secret.value}\n`);
    } catch (error) {
      logger.error('Failed to reveal secret', error);
      process.exit(1);
    }
  });

secretCommand
  .command('add')
  .description('Add a new secret to the active environment')
  .action(async () => {
    try {
      const envId = await ensureEnvContext();
      
      const { key, value } = await prompts([
        {
          type: 'text',
          name: 'key',
          message: 'Enter the Secret Key (e.g., API_KEY):',
          validate: (val: string) => (val.trim().length > 0 ? true : 'Key cannot be empty'),
        },
        {
          type: 'text',
          name: 'value',
          message: 'Enter the Secret Value:',
          validate: (val: string) => (val.trim().length > 0 ? true : 'Value cannot be empty'),
        }
      ]);

      if (!key || !value) process.exit(1);

      logger.info(`Encrypting and saving secret '${key}'...`);
      const secret = await createSecret(envId, key, value);
      logger.success(`Secret saved successfully! (ID: ${secret.id})`);
    } catch (error) {
      logger.error('Failed to add secret', error);
      process.exit(1);
    }
  });

secretCommand
  .command('update')
  .description('Update an existing secret (Note: Deletes old and creates new)')
  .action(async () => {
    try {
      const envId = await ensureEnvContext();

      const { secretId, key, value } = await prompts([
        {
          type: 'text',
          name: 'secretId',
          message: 'Enter the ID of the secret you want to update:',
          validate: (val: string) => (val.trim().length > 0 ? true : 'Secret ID cannot be empty'),
        },
        {
          type: 'text',
          name: 'key',
          message: 'Enter the new or existing Secret Key:',
          validate: (val: string) => (val.trim().length > 0 ? true : 'Key cannot be empty'),
        },
        {
          type: 'text',
          name: 'value',
          message: 'Enter the new Secret Value:',
          validate: (val: string) => (val.trim().length > 0 ? true : 'Value cannot be empty'),
        }
      ]);

      if (!secretId || !key || !value) process.exit(1);

      logger.info(`Deleting old secret...`);
      await deleteSecret(secretId);
      logger.info(`Encrypting and saving updated secret '${key}'...`);
      const secret = await createSecret(envId, key, value);
      logger.success(`Secret updated successfully! (New ID: ${secret.id})`);
    } catch (error) {
      logger.error('Failed to update secret', error);
      process.exit(1);
    }
  });

secretCommand
  .command('delete')
  .description('Delete a secret')
  .action(async () => {
    try {
      const { secretId, confirm } = await prompts([
        {
          type: 'text',
          name: 'secretId',
          message: 'Enter the Secret ID to delete:',
          validate: (val: string) => (val.trim().length > 0 ? true : 'Secret ID cannot be empty'),
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you absolutely sure you want to delete this secret? This cannot be undone.',
          initial: false
        }
      ]);

      if (!secretId || !confirm) {
        logger.info('Action cancelled.');
        return;
      }

      logger.info(`Deleting secret...`);
      await deleteSecret(secretId);
      logger.success(`Secret deleted successfully!`);
    } catch (error) {
      logger.error('Failed to delete secret', error);
      process.exit(1);
    }
  });
