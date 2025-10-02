'use strict';

/**
 * This is a documentation migration that represents the current database schema.
 * It's not meant to be run, but serves as a reference of the database structure.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('This is a documentation-only migration file. It should not be run.');
    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // No-op for documentation migration
    return Promise.resolve();
  }
};

/*
DATABASE SCHEMA DOCUMENTATION
============================

ENUM TYPES:
-----------
1. enum_revenues_category:
   - 'expenses'
   - 'income'
   - 'other'

2. enum_payments_paymenttype:
   - 'membership_fee'
   - 'monthly_contribution'

3. enum_payments_status:
   - 'pending'
   - 'paid'
   - 'overdue'

4. user_role:
   - '1' (admin)
   - '2' (staff)

TABLES:
-------

1. Branches
   - id: SERIAL PRIMARY KEY
   - name: VARCHAR(255) NOT NULL UNIQUE
   - isActive: BOOLEAN DEFAULT true
   - createdAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updatedAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()

2. Users
   - id: SERIAL PRIMARY KEY
   - username: VARCHAR(255) NOT NULL UNIQUE
   - password: VARCHAR(255) NOT NULL
   - email: VARCHAR(255) UNIQUE
   - name: VARCHAR(255)
   - role: user_role NOT NULL DEFAULT '2'
   - createdAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updatedAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()

3. FieldWorkers
   - worker_id: SERIAL PRIMARY KEY
   - name: VARCHAR(100) NOT NULL
   - age: INTEGER
   - address: VARCHAR(255)
   - contact_number: VARCHAR(20)
   - branch_assigned: VARCHAR(50)
   - createdAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updatedAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()

4. Members
   - id: SERIAL PRIMARY KEY
   - applicationNumber: VARCHAR(50) UNIQUE
   - fullName: VARCHAR(255) NOT NULL
   - nickname: VARCHAR(100)
   - age: INTEGER
   - program: VARCHAR(50)
   - ageBracket: VARCHAR(50)
   - contributionAmount: DECIMAL(10,2)
   - availmentPeriod: VARCHAR(100)
   - picture: TEXT
   - dateApplied: DATE
   - completeAddress: TEXT
   - provincialAddress: TEXT
   - dateOfBirth: DATE
   - placeOfBirth: VARCHAR(255)
   - sex: VARCHAR(20)
   - civilStatus: VARCHAR(50)
   - spouseName: VARCHAR(255)
   - spouseDob: DATE
   - churchAffiliation: TEXT
   - educationAttainment: VARCHAR(255)
   - presentEmployment: VARCHAR(255)
   - employerName: VARCHAR(255)
   - contactNumber: VARCHAR(50)
   - beneficiaryName: VARCHAR(255)
   - beneficiaryDob: DATE
   - beneficiaryAge: INTEGER
   - beneficiaryRelationship: VARCHAR(100)
   - datePaid: DATE
   - receivedBy: VARCHAR(255)
   - orNumber: VARCHAR(100)
   - endorsedBy: VARCHAR(255)
   - branchId: INTEGER REFERENCES "Branches"("id") ON DELETE SET NULL
   - membershipFeePaid: BOOLEAN DEFAULT false
   - membershipFeePaidDate: DATE
   - lastContributionDate: DATE
   - nextDueDate: DATE
   - createdAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updatedAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()

5. Payments
   - id: SERIAL PRIMARY KEY
   - amount: DECIMAL(10,2) NOT NULL
   - paymentDate: TIMESTAMPTZ NOT NULL
   - paymentType: enum_payments_paymenttype NOT NULL
   - periodStart: DATE
   - periodEnd: DATE
   - status: enum_payments_status NOT NULL DEFAULT 'pending'
   - referenceNumber: VARCHAR(100)
   - notes: TEXT
   - memberId: INTEGER NOT NULL REFERENCES "Members"("id") ON DELETE CASCADE
   - lastSmsNotification: TIMESTAMPTZ
   - createdAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updatedAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()

6. Revenues
   - id: SERIAL PRIMARY KEY
   - amount: DECIMAL(10,2) NOT NULL
   - description: VARCHAR(255) NOT NULL
   - date: DATE NOT NULL
   - category: enum_revenues_category NOT NULL DEFAULT 'other'
   - userId: INTEGER REFERENCES "Users"("id") ON DELETE CASCADE
   - branchId: INTEGER REFERENCES "Branches"("id") ON DELETE SET NULL
   - paymentId: INTEGER REFERENCES "Payments"("id") ON DELETE SET NULL
   - createdAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()
   - updatedAt: TIMESTAMPTZ NOT NULL DEFAULT NOW()

INDEXES:
--------
- idx_members_branchId ON "Members"("branchId")
- idx_revenues_userId ON "Revenues"("userId")
- idx_revenues_branchId ON "Revenues"("branchId")
- idx_payments_memberId ON "Payments"("memberId")
- idx_payments_paymentDate ON "Payments"("paymentDate")
- idx_payments_status ON "Payments"("status")
- idx_payments_date ON "Payments"("paymentDate" DESC)

FUNCTIONS & TRIGGERS:
---------------------

1. update_modified_column()
   - Updates the 'updatedAt' timestamp on any table with a trigger

2. log_payment_as_revenue()
   - Creates a revenue record when a payment is marked as 'paid'
   - Trigger: payments_after_insert_log_revenue
   - Runs on: AFTER INSERT OR UPDATE ON "Payments"
   - Only processes when status changes to 'paid'

TRIGGERS:
---------
1. update_branches_modtime
   - Updates updatedAt on Branches table

2. update_users_modtime
   - Updates updatedAt on Users table

3. update_members_modtime
   - Updates updatedAt on Members table

4. update_revenues_modtime
   - Updates updatedAt on Revenues table

5. update_payments_modtime
   - Updates updatedAt on Payments table

6. payments_after_insert_log_revenue
   - Calls log_payment_as_revenue() on payment insert/update

RELATIONSHIPS:
-------------
1. Members.branchId → Branches.id (Many-to-One)
2. Revenues.userId → Users.id (Many-to-One)
3. Revenues.branchId → Branches.id (Many-to-One)
4. Revenues.paymentId → Payments.id (One-to-One)
5. Payments.memberId → Members.id (Many-to-One)

NOTES:
------
- All tables include createdAt and updatedAt timestamps
- All foreign keys have appropriate ON DELETE behaviors
- Payment types are restricted to 'membership_fee' or 'monthly_contribution'
- Payment statuses are restricted to 'pending', 'paid', or 'overdue'
- Revenue categories are restricted to 'expenses', 'income', or 'other'
- The log_payment_as_revenue trigger ensures revenue records are created for paid payments
*/

// This file is for documentation purposes only and should not be run as a migration.
