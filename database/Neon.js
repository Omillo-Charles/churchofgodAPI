import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { NEON_DATABASE_URI } from "../config/env.js";

const pool = new pg.Pool({ connectionString: NEON_DATABASE_URI });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Neon Database Connected Successfully");
    } catch (error) {
        console.error("Neon Database Connection Error:", error);
        process.exit(1);
    }
};

export default prisma;
