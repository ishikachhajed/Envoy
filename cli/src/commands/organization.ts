import { Command } from 'commander';
import prompts from 'prompts';
import { listOrganizations, createOrganization } from '../services/organizationService.js';
import { logger } from '../utils/logger.js';
export const orgCommand = new Command('org')
  .description('Manage Envoy Vault organizations');
orgCommand
  .command('list')
  .description('List all organizations you belong to')
  .action(async () => {
    try {
      logger.info('Fetching organizations...');
      const orgs = await listOrganizations();
      
      if (orgs.length === 0) {
        logger.warn('You do not belong to any organizations yet.');
        return;
      }
      logger.success('Organizations:');
      orgs.forEach((org, index) => {
        console.log(`  ${index + 1}. ${org.name} (ID: ${org.id})`);
      });
    } catch (error) {
      logger.error('Failed to fetch organizations', error);
      process.exit(1);
    }
  });
orgCommand
  .command('create')
  .description('Create a new organization')
  .action(async () => {
    try {
      const { name } = await prompts({
        type: 'text',
        name: 'name',
        message: 'Enter the name of the new organization:',
        validate: (value: string) => (value.trim().length > 0 ? true : 'Organization name cannot be empty'),
      });
      if (!name) {
        logger.error('Organization name is required.');
        process.exit(1);
      }
      logger.info(`Creating organization '${name}'...`);
      const org = await createOrganization(name);
      logger.success(`Organization '${org.name}' created successfully! (ID: ${org.id})`);
    } catch (error) {
      logger.error('Failed to create organization', error);
      process.exit(1);
    }
  });