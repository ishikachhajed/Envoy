import prompts from 'prompts';
import { listOrganizations } from '../services/organizationService.js';
import { loadConfig, saveConfig } from '../storage/configStore.js';
import { logger } from './logger.js';
export const ensureOrganization = async (): Promise<string> => {
  const config = loadConfig();
  if (config.organizationId) {
    return config.organizationId;
  }
  logger.warn('No active organization set.');
  logger.info('Fetching your organizations...');
  const orgs = await listOrganizations();
  if (orgs.length === 0) {
    logger.error('You do not belong to any organizations. Create one using "envoy org create".');
    process.exit(1);
  }
  const { orgId } = await prompts({
    type: 'select',
    name: 'orgId',
    message: 'Select an active organization for this session:',
    choices: orgs.map(org => ({ title: org.name, value: org.id })),
  });
  if (!orgId) {
    process.exit(1);
  }
  saveConfig({ organizationId: orgId });
  logger.success('Active organization saved.');
  return orgId;
};