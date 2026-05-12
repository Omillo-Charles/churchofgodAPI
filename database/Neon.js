import { PrismaClient } from "@prisma/client";
import { NEON_DATABASE_URI } from "../config/env.js";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: NEON_DATABASE_URI,
        },
    },
});

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
