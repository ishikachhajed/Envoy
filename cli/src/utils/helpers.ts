import prompts from 'prompts';
import { listOrganizations } from '../services/organizationService.js';
import { listProjects } from '../services/projectService.js';
import { getApiClient } from '../api/client.js';
import { loadConfig, saveConfig } from '../storage/configStore.js';
import { logger } from './logger.js';

export const listEnvironments = async (projectId: string): Promise<{id: string, name: string}[]> => {
  const client = getApiClient();
  const response = await client.get(`/api/projects/${projectId}/environments`);
  return response.data;
};

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

export const ensureProject = async (): Promise<string> => {
  const config = loadConfig();

  if (config.projectId) {
    return config.projectId;
  }

  const orgId = await ensureOrganization();

  logger.warn('No active project set.');
  logger.info('Fetching projects...');

  const projects = await listProjects(orgId);

  if (projects.length === 0) {
    logger.error('No projects found. Create one using "envoy project create".');
    process.exit(1);
  }

  const { projectId } = await prompts({
    type: 'select',
    name: 'projectId',
    message: 'Select an active project for this session:',
    choices: projects.map(project => ({
      title: project.name,
      value: project.id,
    })),
  });

  if (!projectId) {
    process.exit(1);
  }

  saveConfig({ projectId });

  logger.success('Active project saved.');

  return projectId;
};

export const ensureEnvironment = async (): Promise<string> => {
  const config = loadConfig();

  if (config.environment) {
    return config.environment;
  }

  const projectId = await ensureProject();

  logger.warn('No active environment set.');
  logger.info('Fetching environments...');

  const environments = await listEnvironments(projectId);

  if (environments.length === 0) {
    logger.error('No environments found for this project.');
    process.exit(1);
  }

  const { environment } = await prompts({
    type: 'select',
    name: 'environment',
    message: 'Select an environment:',
    choices: environments.map(env => ({
      title: env.name,
      value: env.id,
    })),
  });

  if (!environment) {
    process.exit(1);
  }

  saveConfig({ environment });

  logger.success('Active environment saved.');

  return environment;
};