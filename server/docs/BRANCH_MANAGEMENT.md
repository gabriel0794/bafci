# Branch Management Guide

## Overview
The revenue system now supports branch tracking. Each revenue entry can be associated with a specific branch to help differentiate revenue sources across different locations.

## Current Branches
- Ozamiz
- Opol
- Cagayan de Oro City
- Gingoog
- Claveria
- Molave
- Jimenez

## Adding a New Branch

### Method 1: Using the API (Recommended for Admin Users)

Admin users can add new branches through the API endpoint:

**Endpoint:** `POST /api/branches`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-auth-token": "YOUR_ADMIN_TOKEN"
}
```

**Request Body:**
```json
{
  "name": "New Branch Name"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:5000/api/branches \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_ADMIN_TOKEN" \
  -d '{"name": "Iligan City"}'
```

### Method 2: Direct Database Insert

If you have direct database access, you can insert a new branch:

```sql
INSERT INTO "Branches" (name, "isActive", "createdAt", "updatedAt")
VALUES ('New Branch Name', true, NOW(), NOW());
```

### Method 3: Using Sequelize CLI Seed

Create a new seed file:

```bash
npx sequelize-cli seed:generate --name add-new-branch
```

Then edit the generated file in `server/migrations/` folder:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Branches', [{
      name: 'New Branch Name',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Branches', {
      name: 'New Branch Name'
    });
  }
};
```

Run the seed:
```bash
npx sequelize-cli db:seed --seed XXXXXXXXXXXXXX-add-new-branch.js
```

## Managing Branches

### Get All Active Branches
**Endpoint:** `GET /api/branches`

Returns all active branches in alphabetical order.

### Update a Branch
**Endpoint:** `PUT /api/branches/:id`

**Request Body:**
```json
{
  "name": "Updated Branch Name",
  "isActive": true
}
```

### Deactivate a Branch
**Endpoint:** `DELETE /api/branches/:id`

This performs a soft delete by setting `isActive` to `false`. The branch will no longer appear in the dropdown but existing revenue entries will still reference it.

## Database Schema

### Branches Table
```sql
CREATE TABLE "Branches" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

### Revenue Table (with Branch Reference)
The `Revenues` table now includes a `branchId` column that references the `Branches` table:

```sql
ALTER TABLE "Revenues" 
ADD COLUMN "branchId" INTEGER REFERENCES "Branches"(id) ON DELETE SET NULL;
```

## Notes

- Only Admin users (role = 1) can add, update, or delete branches
- Staff users (role = 2) can view branches and assign them to revenue entries
- Branch names must be unique
- Deleting a branch sets it to inactive rather than removing it from the database
- Existing revenue entries will show "N/A" if they don't have an associated branch
