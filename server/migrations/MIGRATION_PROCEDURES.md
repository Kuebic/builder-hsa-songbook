# HSA Songbook Data Migration Procedures

## Overview
This document outlines the procedures for safely migrating user favorites from the old single-array system to the new dual-favorites system (songs and arrangements).

## Pre-Migration Checklist

1. **Notify Users**: Send notification about scheduled maintenance
2. **Database Backup**: Create full database backup using MongoDB tools
3. **Code Deployment**: Ensure new code is deployed but migration not yet run
4. **Test Environment**: Run migration in staging environment first

## Migration Steps

### 1. Full Database Backup
```bash
# Create timestamped backup
mongodump --uri="mongodb://localhost:27017/hsa-songbook" --out="./backups/full-$(date +%Y%m%d-%H%M%S)"
```

### 2. Run Migration Script
```bash
# Navigate to server directory
cd server

# Run migration (creates automatic backup)
npm run migrate:favorites

# Or with TypeScript directly
npx ts-node migrations/migrate-user-favorites.ts
```

### 3. Verify Migration
```bash
# Check migration report
ls -la migration-reports/

# Verify in MongoDB shell
mongosh
use hsa-songbook
db.users.findOne({ favoriteSongs: { $exists: true } })
```

### 4. Optional: Remove Old Field
```bash
# Only after verification
REMOVE_OLD_FIELD=true npm run migrate:favorites
```

## Rollback Procedures

### Automatic Rollback (Using Migration Backup)
```bash
# Find backup file
ls -la backups/users-backup-*.json

# Run rollback
npx ts-node -e "
const { rollbackFavoritesMigration } = require('./migrations/migrate-user-favorites');
rollbackFavoritesMigration('./backups/users-backup-2024-01-20T10-30-00.000Z.json')
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
"
```

### Manual Rollback (Using MongoDB Backup)
```bash
# Restore from full backup
mongorestore --uri="mongodb://localhost:27017/hsa-songbook" --drop ./backups/full-20240120-103000/
```

## Post-Migration Validation

### 1. Data Integrity Checks
```javascript
// Run in MongoDB shell
// Check users have proper favorites
db.users.aggregate([
  { $match: { $or: [
    { favoriteSongs: { $exists: true } },
    { favoriteArrangements: { $exists: true } }
  ]}},
  { $project: {
    email: 1,
    songCount: { $size: "$favoriteSongs" },
    arrangementCount: { $size: "$favoriteArrangements" }
  }}
])

// Verify no orphaned favorites
db.users.aggregate([
  { $unwind: "$favoriteSongs" },
  { $lookup: {
    from: "songs",
    localField: "favoriteSongs",
    foreignField: "_id",
    as: "song"
  }},
  { $match: { song: { $size: 0 } } },
  { $group: { _id: "$_id", orphanedSongs: { $sum: 1 } } }
])
```

### 2. API Testing
```bash
# Test favorites endpoints
curl -X GET http://localhost:3000/api/users/:userId/favorites?type=songs
curl -X GET http://localhost:3000/api/users/:userId/favorites?type=arrangements
curl -X GET http://localhost:3000/api/users/:userId/favorites?type=both
```

### 3. UI Verification
- Log in as test user
- Check favorites appear in both songs and arrangements
- Test adding/removing favorites
- Verify backward compatibility

## Monitoring

### During Migration
- Monitor server logs for errors
- Check database performance metrics
- Watch for user complaints

### Post-Migration
- Monitor error rates for favorites endpoints
- Check for increased support tickets
- Review migration reports for any errors

## Emergency Contacts
- Database Admin: [contact]
- Lead Developer: [contact]
- On-call Engineer: [contact]

## Migration Script Features

### Automatic Backup
The migration script automatically creates a backup before starting:
- Location: `./backups/users-backup-[timestamp].json`
- Contains: All users with favorites field
- Format: JSON for easy inspection

### Migration Report
After completion, a detailed report is generated:
- Location: `./migration-reports/favorites-migration-[timestamp].json`
- Contains: Stats, errors, timing information

### Safety Features
1. **Idempotency**: Script checks if user already migrated
2. **Validation**: Verifies each favorite ID exists
3. **Error Handling**: Continues on individual errors
4. **Detailed Logging**: Console output for monitoring

## Common Issues

### Issue: Migration Taking Too Long
**Solution**: Run in batches
```javascript
// Modify migration script to process in batches
const BATCH_SIZE = 100;
const users = await User.find({ favorites: { $exists: true } }).limit(BATCH_SIZE);
```

### Issue: Memory Issues
**Solution**: Increase Node memory
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run migrate:favorites
```

### Issue: Duplicate Favorites
**Solution**: The new model methods handle duplicates automatically

## Testing Migration

### Local Testing
```bash
# 1. Copy production data to local (sanitized)
mongodump --uri="mongodb://prod-server/hsa-songbook" --out="./prod-backup"
mongorestore --uri="mongodb://localhost:27017/hsa-songbook-test" ./prod-backup

# 2. Run migration on test database
MONGO_URI="mongodb://localhost:27017/hsa-songbook-test" npm run migrate:favorites

# 3. Verify results
```

### Staging Environment
1. Deploy code to staging
2. Run migration with small dataset
3. Perform full QA testing
4. Document any issues

## Success Criteria
- [ ] All users with favorites migrated successfully
- [ ] No data loss reported
- [ ] API endpoints functioning correctly
- [ ] UI displays favorites properly
- [ ] Performance metrics within acceptable range
- [ ] Zero critical errors in logs