import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const records = sqliteTable("records", {
 id: text("id").primaryKey(), kind: text("kind").notNull(), title: text("title").notNull(),
 projectId: text("project_id").notNull().default(""), status: text("status").notNull(),
 data: text("data").notNull().default("{}"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull()
}, t => [index("idx_records_kind_project").on(t.kind,t.projectId)]);

export const jobs = sqliteTable("jobs", {
 id:text("id").primaryKey(), projectId:text("project_id").notNull(), objective:text("objective").notNull(),
 mode:text("mode").notNull(), status:text("status").notNull(), phase:text("phase").notNull(),
 payload:text("payload").notNull(), result:text("result").notNull().default("{}"),
 attempts:text("attempts").notNull().default("0"), leaseToken:text("lease_token"),leaseUntil:text("lease_until"),
 createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull()
},t=>[index("idx_jobs_status_created").on(t.status,t.createdAt)]);
export const runtimeSettings=sqliteTable("runtime_settings",{id:text("id").primaryKey(),data:text("data").notNull(),updatedAt:text("updated_at").notNull()});
