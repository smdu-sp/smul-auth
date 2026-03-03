import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const url = process.env.DATABASE_URL;
    let adapter: PrismaMariaDb;
    if (url) {
      const u = new URL(url);
      adapter = new PrismaMariaDb({
        host: u.hostname,
        port: u.port ? parseInt(u.port, 10) : undefined,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
      });
    } else {
      adapter = new PrismaMariaDb({});
    }
    super({ adapter });
  }
}
