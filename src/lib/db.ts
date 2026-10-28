import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
}

// Lazy singleton: the client is created only when first used,
// so the build does not fail if DATABASE_URL is missing at build time.

export function getPrisma(): PrismaClient{
    if(!globalForPrisma.prisma){
        const connectionString = process.env.DATABASE_URL;
        if(!connectionString){
            throw new Error("The url is missing");
        }

        const adapter = new PrismaNeon({ connectionString });
        globalForPrisma.prisma = new PrismaClient({ adapter});
    }
    return globalForPrisma.prisma
}