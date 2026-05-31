-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CampaignAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "deposit" REAL NOT NULL DEFAULT 0,
    "depositTime" DATETIME,
    "volume" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "crossedBonus" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CampaignAccount_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CampaignAccount" ("campaignId", "createdAt", "deposit", "depositTime", "email", "id", "note", "uid", "volume", "wallet") SELECT "campaignId", "createdAt", "deposit", "depositTime", "email", "id", "note", "uid", "volume", "wallet" FROM "CampaignAccount";
DROP TABLE "CampaignAccount";
ALTER TABLE "new_CampaignAccount" RENAME TO "CampaignAccount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
