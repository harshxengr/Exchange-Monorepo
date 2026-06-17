import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  WS_PORT: z.string().default('8080'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required for PostgreSQL access"),
})

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid or missing environment configuration variables:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;