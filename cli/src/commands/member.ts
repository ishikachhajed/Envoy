import { Command } from 'commander';
import prompts from 'prompts';
import { listMembers, inviteMember, updateMemberRole, removeMember } from '../services/memberService.js';
import { ensureOrganization } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
export const memberCommand = new Command('member')
  .description('Manage Envoy Vault organization members');
memberCommand
  .command('list')
  .description('List all members in the active organization')
  .action(async () => {
    try {
      const orgId = await ensureOrganization();
      logger.info('Fetching members...');
      const members = await listMembers(orgId);
    console.log(JSON.stringify(members, null, 2));
      
      if (members.length === 0) {
        logger.warn('No members found in this organization.');
        return;
      }
      logger.success('Members:');
      members.forEach((member, index) => {
        console.log(
  `  ${index + 1}. [${member.role.toUpperCase()}] ${member.userName} (${member.userEmail})`
);
      });
    } catch (error) {
      logger.error('Failed to fetch members', error);
      process.exit(1);
    }
  });
memberCommand
  .command('invite')
  .description('Invite a new member to the active organization')
  .action(async () => {
    try {
      const orgId = await ensureOrganization();
      
      const { email, role } = await prompts([
        {
          type: 'text',
          name: 'email',
          message: 'Enter the email address to invite:',
          validate: (value: string) => (value.includes('@') ? true : 'Please enter a valid email address'),
        },
        {
          type: 'select',
          name: 'role',
          message: 'Select the role for this member:',
          choices: [
            { title: 'Member', value: 'MEMBER' },
            { title: 'Admin', value: 'ADMIN' }
          ]
        }
      ]);
      if (!email || !role) {
        logger.error('Email and role are required.');
        process.exit(1);
      }
      logger.info(`Inviting ${email} as ${role}...`);
      await inviteMember(orgId, email, role);
      logger.success(`Invitation sent to ${email}!`);
    } catch (error) {
      logger.error('Failed to invite member', error);
      process.exit(1);
    }
  });
memberCommand
  .command('role')
  .description('Change the role of an existing member')
  .action(async () => {
    try {
      const orgId = await ensureOrganization();
      
      const { userId, role } = await prompts([
        {
          type: 'text',
          name: 'userId',
          message: 'Enter the membership ID of the member:',
          validate: (value: string) => (value.trim().length > 0 ? true : 'Membership ID cannot be empty'),
        },
        {
          type: 'select',
          name: 'role',
          message: 'Select the new role:',
          choices: [
            { title: 'Member', value: 'MEMBER' },
            { title: 'Admin', value: 'ADMIN' }
          ]
        }
      ]);
      if (!userId || !role) {
        process.exit(1);
      }
      logger.info(`Updating role for user ${userId} to ${role}...`);
      await updateMemberRole(orgId, userId, role);
      logger.success(`Role updated successfully!`);
    } catch (error) {
      logger.error('Failed to update member role', error);
      process.exit(1);
    }
  });
memberCommand
  .command('remove')
  .description('Remove a member from the active organization')
  .action(async () => {
    try {
      const orgId = await ensureOrganization();
      
      const { userId, confirm } = await prompts([
        {
          type: 'text',
          name: 'userId',
          message: 'Enter the user ID to remove:',
          validate: (value: string) => (value.trim().length > 0 ? true : 'User ID cannot be empty'),
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to remove this member?',
          initial: false
        }
      ]);
      if (!userId || !confirm) {
        logger.info('Action cancelled.');
        return;
      }
      logger.info(`Removing user ${userId}...`);
      await removeMember(orgId, userId);
      logger.success(`Member removed successfully!`);
    } catch (error) {
      logger.error('Failed to remove member', error);
      process.exit(1);
    }
  });