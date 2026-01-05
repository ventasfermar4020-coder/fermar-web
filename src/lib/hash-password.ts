#!/usr/bin/env node

import bcrypt from 'bcryptjs';

/**
 * Utility script to generate bcrypt password hashes for admin authentication
 *
 * Usage:
 *   npx tsx src/lib/hash-password.ts <your-password>
 *
 * Example:
 *   npx tsx src/lib/hash-password.ts mySecurePassword123
 */

const WORK_FACTOR = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, WORK_FACTOR);
}

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Error: Please provide a password as an argument');
    console.error('\nUsage:');
    console.error('  npx tsx src/lib/hash-password.ts <your-password>');
    console.error('\nExample:');
    console.error('  npx tsx src/lib/hash-password.ts mySecurePassword123');
    process.exit(1);
  }

  if (password.length < 8) {
    console.warn('Warning: Password is less than 8 characters. Consider using a stronger password.');
  }

  console.log('Generating password hash...\n');

  const hash = await hashPassword(password);

  console.log('Password hash generated successfully!');
  console.log('Copy the following hash to your .env file:\n');
  console.log(hash);
  console.log('\nAdd this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
}

main().catch((error) => {
  console.error('Error generating hash:', error);
  process.exit(1);
});
