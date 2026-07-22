import { and, eq } from "drizzle-orm";
import { RoleSchema, type Role } from "@stamped/l6-contracts";
import type { Db } from "../db/client.js";
import {
  memberships,
  organizations,
  plantMemberships,
  plants,
  userPreferences,
} from "../db/schema.js";

export type MembershipRecord = {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  status: string;
  plantIds: string[];
};

export async function createOrganization(
  db: Db,
  input: { slug: string; name: string },
) {
  const [org] = await db
    .insert(organizations)
    .values({ slug: input.slug, name: input.name })
    .returning();
  return org;
}

export async function createPlant(
  db: Db,
  input: {
    orgId: string;
    externalPlantId: string;
    name: string;
    timezone?: string;
  },
) {
  const [plant] = await db
    .insert(plants)
    .values({
      orgId: input.orgId,
      externalPlantId: input.externalPlantId,
      name: input.name,
      timezone: input.timezone ?? "Asia/Kolkata",
    })
    .returning();
  return plant;
}

export async function addMembership(
  db: Db,
  input: {
    userId: string;
    orgId: string;
    role: Role;
    plantIds: string[];
  },
): Promise<MembershipRecord> {
  const role = RoleSchema.parse(input.role);
  const [membership] = await db
    .insert(memberships)
    .values({
      userId: input.userId,
      orgId: input.orgId,
      role,
      status: "active",
    })
    .returning();

  if (input.plantIds.length > 0) {
    await db.insert(plantMemberships).values(
      input.plantIds.map((plantId) => ({
        membershipId: membership.id,
        plantId,
      })),
    );
  }

  return {
    id: membership.id,
    userId: membership.userId,
    orgId: membership.orgId,
    role,
    status: membership.status,
    plantIds: input.plantIds,
  };
}

export async function listMembershipsForUser(
  db: Db,
  userId: string,
): Promise<MembershipRecord[]> {
  const rows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));

  const result: MembershipRecord[] = [];
  for (const row of rows) {
    const plantRows = await db
      .select()
      .from(plantMemberships)
      .where(eq(plantMemberships.membershipId, row.id));
    result.push({
      id: row.id,
      userId: row.userId,
      orgId: row.orgId,
      role: RoleSchema.parse(row.role),
      status: row.status,
      plantIds: plantRows.map((p) => p.plantId),
    });
  }
  return result;
}

export async function assertPlantAccess(
  db: Db,
  input: { userId: string; orgId: string; plantId: string },
): Promise<MembershipRecord> {
  const membership = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, input.userId),
        eq(memberships.orgId, input.orgId),
        eq(memberships.status, "active"),
      ),
    )
    .then((rows) => rows[0]);

  if (!membership) {
    throw Object.assign(new Error("No active membership for organization"), {
      statusCode: 403,
      code: "TENANCY_FORBIDDEN",
    });
  }

  const plantRows = await db
    .select()
    .from(plantMemberships)
    .where(eq(plantMemberships.membershipId, membership.id));
  const plantIds = plantRows.map((p) => p.plantId);
  if (!plantIds.includes(input.plantId)) {
    throw Object.assign(new Error("Plant not in membership scope"), {
      statusCode: 403,
      code: "PLANT_FORBIDDEN",
    });
  }

  return {
    id: membership.id,
    userId: membership.userId,
    orgId: membership.orgId,
    role: RoleSchema.parse(membership.role),
    status: membership.status,
    plantIds,
  };
}

/** Seed demo org + plant + admin membership for local/dev. */
export async function seedDemoTenant(
  db: Db,
  input: { adminUserId: string },
) {
  const org = await createOrganization(db, {
    slug: "demo",
    name: "Demo Industries",
  });
  const plant = await createPlant(db, {
    orgId: org.id,
    externalPlantId: "plant_jaipur_01",
    name: "Jaipur Works",
  });
  const membership = await addMembership(db, {
    userId: input.adminUserId,
    orgId: org.id,
    role: "admin",
    plantIds: [plant.id],
  });
  await db.insert(userPreferences).values({
    userId: input.adminUserId,
    orgId: org.id,
    activePlantId: plant.id,
    prefs: {},
  });
  return { org, plant, membership };
}
