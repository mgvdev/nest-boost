/**
 * The source-of-truth map of NestJS ecosystem packages that nest-boost knows
 * about. Detection filters this list against a project's package.json; each
 * matched entry may contribute a guideline and/or a skill. Reused by the
 * install/update commands and the App Info MCP tool.
 */
export interface EcosystemEntry {
  /** Stable identifier, also the guideline/skill folder name when applicable. */
  id: string;
  /** Human label for output. */
  label: string;
  /** npm package name(s) that indicate this entry is in use (any match wins). */
  match: string[];
  /** Guideline file (relative to resources/guidelines) to include when detected. */
  guideline?: string;
  /** Skill folder (relative to resources/skills) to install when detected. */
  skill?: string;
}

export const ECOSYSTEM: EcosystemEntry[] = [
  {
    id: "nestjs",
    label: "NestJS",
    match: ["@nestjs/core", "@nestjs/common"],
    guideline: "core.md",
    skill: "nestjs-development",
  },
  {
    id: "config",
    label: "Nest Config",
    match: ["@nestjs/config"],
    guideline: "config.md",
  },
  {
    id: "swagger",
    label: "Swagger / OpenAPI",
    match: ["@nestjs/swagger"],
    guideline: "swagger.md",
  },
  {
    id: "graphql",
    label: "GraphQL",
    match: ["@nestjs/graphql", "@nestjs/apollo"],
    guideline: "graphql.md",
    skill: "graphql-development",
  },
  {
    id: "orpc",
    label: "oRPC",
    match: ["@orpc/nest", "@orpc/contract"],
    skill: "orpc-development",
  },
  {
    id: "typeorm",
    label: "TypeORM",
    match: ["@nestjs/typeorm", "typeorm"],
    guideline: "typeorm.md",
    skill: "typeorm-development",
  },
  {
    id: "mongoose",
    label: "Mongoose",
    match: ["@nestjs/mongoose", "mongoose"],
    guideline: "mongoose.md",
  },
  {
    id: "prisma",
    label: "Prisma",
    match: ["prisma", "@prisma/client"],
    guideline: "prisma.md",
  },
  {
    id: "passport",
    label: "Auth (Passport / JWT)",
    match: ["@nestjs/passport", "@nestjs/jwt", "passport"],
    // Auth guidance is owned by the install-time auth-strategy choice, not detection.
  },
  {
    id: "better-auth",
    label: "Better Auth",
    match: ["better-auth", "@thallesp/nestjs-better-auth"],
    // Guidance/skill owned by the auth-strategy choice; listed here for App Info.
  },
  {
    id: "bull",
    label: "Queues (Bull / BullMQ)",
    match: ["@nestjs/bull", "@nestjs/bullmq", "bull", "bullmq"],
    guideline: "queues.md",
  },
  {
    id: "validation",
    label: "Validation",
    match: ["class-validator", "class-transformer"],
    guideline: "validation.md",
  },
  {
    id: "testing",
    label: "Testing",
    match: ["@nestjs/testing", "jest", "vitest"],
    guideline: "testing.md",
    skill: "testing-jest",
  },
];
