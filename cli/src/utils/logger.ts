import chalk from 'chalk';

export const logger = {
  info: (message: string) => {
    console.log(chalk.blue(message));
  },
  success: (message: string) => {
    console.log(chalk.green(`✔ ${message}`));
  },
  warn: (message: string) => {
    console.log(chalk.yellow(`⚠ ${message}`));
  },
  error: (message: string, error?: any) => {
    console.error(chalk.red(`✖ ${message}`));
    if (error) {
      if (error.response && error.response.data) {
        console.error(chalk.red(`  Details: ${JSON.stringify(error.response.data)}`));
      } else if (error.message) {
        console.error(chalk.red(`  Details: ${error.message}`));
      }
    }
  },
};
