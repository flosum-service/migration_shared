# MIGRATION GUIDE

## Preparation

## ENV

- Setup Source DB env
- Setup Source DB env

# Permissions

- Ensure that you have permissions to insert and alter in target and source db`s.

## Steps 1

- Stop source UserPool instance to block new user actions.
- Stop target UserPool instance to block new user actions.

## Step 2

- Snapshot source UserPool database.
- Snapshot target UserPool database.

# Step 3

- Run `npm run shift`, it should shift id +100 for all tables exclude `actions`, `services`.
- Run `npm run dump`, it should dump all db tables exclude `actions`, `services`.
- Run `npm run restore`, it should push dumped data to target db.
