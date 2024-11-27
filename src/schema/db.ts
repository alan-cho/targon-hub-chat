import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { env } from "@/env.mjs";
import { LuciaAdapter } from "./lucia_adapter";
import { Session, User } from "./schema";

const poolOptions: mysql.PoolOptions = {
  host: env.DATABASE_HOST,
  user: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
const pool = mysql.createPool(poolOptions);

export const db = drizzle(pool);
export const adapter = new LuciaAdapter(db, Session, User);
export type DB = typeof db;
