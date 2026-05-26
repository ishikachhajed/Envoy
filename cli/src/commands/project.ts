import { Command } from 'commander';
import prompts from 'prompts';
import { listProjects, createProject } from '../services/projectService.js';
import { listOrganizations } from '../services/organizationService.js';
import { loadConfig, saveConfig } from '../storage/configStore.js';
import { logger } from '../utils/logger.js';
export const projectCommand = new Command('project')
  .description('Manage Envoy Vault projects');
const ensureOrganization = async (): Promise<string> => {
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
projectCommand
  .command('list')
  .description('List all projects in the active organization')
  .action(async () => {
    try {
      const orgId = await ensureOrganization();
      logger.info('Fetching projects...');
      const projects = await listProjects(orgId);
      
      if (projects.length === 0) {
        logger.warn('No projects found in this organization.');
        return;
      }
      logger.success('Projects:');
      projects.forEach((proj, index) => {
        console.log(`  ${index + 1}. ${proj.name} (ID: ${proj.id})`);
      });
    } catch (error) {
      logger.error('Failed to fetch projects', error);
      process.exit(1);
    }
  });
projectCommand
  .command('create')
  .description('Create a new project in the active organization')
  .action(async () => {
    try {
      const orgId = await ensureOrganization();
      
      const { name, description } = await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'Enter the name of the new project:',
          validate: (value: string) => (value.trim().length > 0 ? true : 'Project name cannot be empty'),
        },
        {
          type: 'text',
          name: 'description',
          message: 'Enter a description (optional):',
        }
      ]);
      if (!name) {
        logger.error('Project name is required.');
        process.exit(1);
      }
      logger.info(`Creating project '${name}'...`);
      const proj = await createProject(orgId, name, description);
      logger.success(`Project '${proj.name}' created successfully! (ID: ${proj.id})`);
    } catch (error) {
      logger.error('Failed to create project', error);
      process.exit(1);
    }
  });