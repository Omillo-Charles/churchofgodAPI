-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'CLERGY', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';
