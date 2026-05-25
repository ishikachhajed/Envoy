import { Command } from 'commander';
import prompts from 'prompts';
import { requestOtp, verifyOtp } from '../services/authService.js';
import { saveConfig } from '../storage/configStore.js';
import { logger } from '../utils/logger.js';
export const loginCommand = new Command('login')
  .description('Login to Envoy Vault using your email address')
  .action(async () => {
    try {
      const { email } = await prompts({
        type: 'text',
        name: 'email',
        message: 'Enter your email address:',
        validate: (value: string) => (value.includes('@') ? true : 'Please enter a valid email address'),
      });
      if (!email) {
        logger.error('Email is required to login.');
        process.exit(1);
      }
      logger.info('Requesting OTP...');
      await requestOtp(email);
      logger.success('OTP sent! Please check your inbox.');
      const { otp } = await prompts({
        type: 'text',
        name: 'otp',
        message: 'Enter the 6-digit OTP:',
        validate: (value: string) => (value.length === 6 ? true : 'OTP must be exactly 6 digits'),
      });
      if (!otp) {
        logger.error('OTP is required to login.');
        process.exit(1);
      }
      logger.info('Verifying OTP...');
      const token = await verifyOtp(email, otp);
      saveConfig({ token });
      logger.success('Successfully logged in! Token saved locally.');
    } catch (error) {
      logger.error('Login failed', error);
      process.exit(1);
    }
  });
