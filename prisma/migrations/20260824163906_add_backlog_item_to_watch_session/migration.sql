ALTER TABLE "WatchSession" ADD COLUMN "backlogItemId" TEXT;

UPDATE "WatchSession" ws
SET "backlogItemId" = bi.id
    FROM "BacklogItem" bi
WHERE bi."groupId" = ws."groupId" AND bi."mediaItemId" = ws."mediaItemId";

-- Step 1's decision, if orphans exist:
DELETE FROM "WatchSession" WHERE "backlogItemId" IS NULL;

ALTER TABLE "WatchSession" ALTER COLUMN "backlogItemId" SET NOT NULL;

ALTER TABLE "WatchSession"
    ADD CONSTRAINT "WatchSession_backlogItemId_fkey"
        FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "WatchSession_backlogItemId_idx" ON "WatchSession"("backlogItemId");

