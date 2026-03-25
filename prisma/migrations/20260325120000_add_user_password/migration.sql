-- AlterTable: add password column for CredentialsProvider setup wizard
ALTER TABLE "User" ADD COLUMN "password" TEXT;
