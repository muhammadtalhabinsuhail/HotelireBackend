// import { PrismaClient } from "@prisma/client";
// import { PrismaPg  } from "@prisma/adapter-pg"

// const prisma = new PrismaClient({
//   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
// });

// export default prisma;
// import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaClient } from './generated/prisma'

// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
// const prisma = new PrismaClient({ adapter })


// import dotenv from "dotenv";
// import { PrismaClient } from '@prisma/client'
// import { PrismaPg } from '@prisma/adapter-pg'

// dotenv.config();

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL,
// });

// const prisma = new PrismaClient({ adapter });

// export default prisma;


// import 'dotenv/config'
// import type { PrismaConfig } from "prisma";
// import { env } from "prisma/config";

// export default {
//   schema: "prisma/schema.prisma",
//   migrations: {
//     path: "prisma/migrations",
//     seed: 'tsx prisma/seed.ts',
//   },
//   datasource: { 
//     url: env("DATABASE_URL") 
//   }
// } satisfies PrismaConfig;

// import 'dotenv/config'
// import { defineConfig, env } from 'prisma/config'

// export default defineConfig({
//   datasource: {
//     url: env('DATABASE_URL'),
//     shadowDatabaseUrl: env('SHADOW_DATABASE_URL')
//   },
// })








    
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";



import { PrismaPg } from '@prisma/adapter-pg'



dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

export default prisma;