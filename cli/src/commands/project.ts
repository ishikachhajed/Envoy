import { Command } from 'commander';
import prompts from 'prompts';
import { listProjects, createProject } from '../services/projectService.js';
import { ensureOrganization } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

export const projectCommand = new Command('project')
  .description('Manage Envoy Vault projects');

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
