var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  activityLogsRelations: () => activityLogsRelations,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertInvoiceItemSchema: () => insertInvoiceItemSchema,
  insertInvoiceSchema: () => insertInvoiceSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertProductSchema: () => insertProductSchema,
  insertUserSchema: () => insertUserSchema,
  invoiceItems: () => invoiceItems,
  invoiceItemsRelations: () => invoiceItemsRelations,
  invoices: () => invoices,
  invoicesRelations: () => invoicesRelations,
  passwordResetTokens: () => passwordResetTokens,
  passwordResetTokensRelations: () => passwordResetTokensRelations,
  products: () => products,
  productsRelations: () => productsRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["Admin", "Manager", "Staff", "Viewer"] }).default("Viewer"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().unique(),
  productName: varchar("product_name").notNull(),
  color: text("color").array().notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  size: text("size").array().notNull(),
  manufacturer: varchar("manufacturer"),
  imageUrls: text("image_urls").array(),
  qrCodeUrl: varchar("qr_code_url"),
  category: varchar("category"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
});
var invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  status: varchar("status", { enum: ["Pending", "Processed", "Deleted"] }).default("Pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 4 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0.085"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  pdfPath: varchar("pdf_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at")
});
var invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  module: varchar("module").notNull(),
  targetId: varchar("target_id"),
  targetName: varchar("target_name"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  invoices: many(invoices),
  processedInvoices: many(invoices),
  activityLogs: many(activityLogs),
  passwordResetTokens: many(passwordResetTokens)
}));
var passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id]
  })
}));
var productsRelations = relations(products, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [products.createdBy],
    references: [users.id]
  }),
  invoiceItems: many(invoiceItems)
}));
var invoicesRelations = relations(invoices, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [invoices.createdBy],
    references: [users.id]
  }),
  processedBy: one(users, {
    fields: [invoices.processedBy],
    references: [users.id]
  }),
  items: many(invoiceItems)
}));
var invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id]
  })
}));
var activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCodeUrl: true
});
var insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true,
  pdfPath: true
});
var insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  invoiceId: true,
  createdAt: true
});
var insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, ilike, count, sql as sql2, isNull, gt } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUserRole(id, role) {
    const [user] = await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserStatus(id, isActive) {
    const [user] = await db.update(users).set({ isActive, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserLastLogin(id) {
    await db.update(users).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async updateUserPassword(userId, passwordHash) {
    const [user] = await db.update(users).set({ password: passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }
  // Password reset operations
  async createPasswordResetToken(userId, tokenHash, expiresAt) {
    const [token] = await db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt }).returning();
    return token;
  }
  async findValidPasswordResetTokenByHash(tokenHash) {
    const [token] = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
      )
    );
    return token;
  }
  async markPasswordResetTokenUsed(tokenId) {
    await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq(passwordResetTokens.id, tokenId));
  }
  // Product operations
  async createProduct(product) {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async getProductByProductId(productId) {
    const [product] = await db.select().from(products).where(eq(products.productId, productId));
    return product;
  }
  async getAllProducts(options) {
    const { limit = 50, offset = 0, search, category, size, stockLevel } = options || {};
    const conditions = [eq(products.isActive, true)];
    if (search) {
      conditions.push(ilike(products.productName, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(products.category, category));
    }
    if (size) {
      conditions.push(sql2`${size} = ANY(${products.size})`);
    }
    if (stockLevel === "low") {
      conditions.push(sql2`${products.quantity} <= 5`);
    } else if (stockLevel === "out") {
      conditions.push(eq(products.quantity, 0));
    } else if (stockLevel === "in") {
      conditions.push(sql2`${products.quantity} > 5`);
    }
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
    const [productsResult, totalResult] = await Promise.all([
      db.select().from(products).where(whereCondition).orderBy(desc(products.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(products).where(whereCondition)
    ]);
    return {
      products: productsResult,
      total: totalResult[0].count
    };
  }
  async updateProduct(id, product) {
    const [updatedProduct] = await db.update(products).set({ ...product, updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id)).returning();
    return updatedProduct;
  }
  async deleteProduct(id) {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }
  async updateProductQRCode(id, qrCodeUrl) {
    const [product] = await db.update(products).set({ qrCodeUrl, updatedAt: /* @__PURE__ */ new Date() }).where(eq(products.id, id)).returning();
    return product;
  }
  async createBulkProducts(productList) {
    return await db.insert(products).values(productList).returning();
  }
  async getLowStockProducts(threshold = 5) {
    return await db.select().from(products).where(and(
      eq(products.isActive, true),
      sql2`${products.quantity} <= ${threshold}`
    )).orderBy(products.quantity);
  }
  // Invoice operations
  async createInvoice(invoice, items) {
    return await db.transaction(async (tx) => {
      const invoiceCount = await tx.select({ count: count() }).from(invoices);
      const invoiceNumber = `INV-${String(invoiceCount[0].count + 1).padStart(4, "0")}`;
      const [newInvoice] = await tx.insert(invoices).values({ ...invoice, invoiceNumber }).returning();
      const invoiceItemsWithId = items.map((item) => ({
        ...item,
        invoiceId: newInvoice.id
      }));
      await tx.insert(invoiceItems).values(invoiceItemsWithId);
      return newInvoice;
    });
  }
  async getInvoice(id) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  async getAllInvoices(options) {
    const { limit = 50, offset = 0, status, startDate, endDate, customerName } = options || {};
    const conditions = [];
    conditions.push(sql2`LOWER(${invoices.status}) != 'deleted'`);
    if (status) {
      conditions.push(eq(invoices.status, status));
    }
    if (startDate) {
      conditions.push(sql2`${invoices.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${invoices.createdAt} <= ${endDate}`);
    }
    if (customerName) {
      conditions.push(ilike(invoices.customerName, `%${customerName}%`));
    }
    const whereCondition = conditions.length > 0 ? conditions.length === 1 ? conditions[0] : and(...conditions) : void 0;
    const [invoicesResult, totalResult] = await Promise.all([
      whereCondition ? db.select().from(invoices).where(whereCondition).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset) : db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(limit).offset(offset),
      whereCondition ? db.select({ count: count() }).from(invoices).where(whereCondition) : db.select({ count: count() }).from(invoices)
    ]);
    return {
      invoices: invoicesResult,
      total: totalResult[0].count
    };
  }
  async updateInvoiceStatus(id, status, processedBy) {
    return await db.transaction(async (tx) => {
      const updateData = { status, updatedAt: /* @__PURE__ */ new Date() };
      if (status === "Processed" && processedBy) {
        updateData.processedBy = processedBy;
        updateData.processedAt = /* @__PURE__ */ new Date();
      }
      const [invoice] = await tx.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
      if (status === "Processed") {
        const items = await tx.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        for (const item of items) {
          const [currentProduct] = await tx.select({ quantity: products.quantity }).from(products).where(eq(products.id, item.productId));
          const newQuantity = (currentProduct?.quantity || 0) - item.quantity;
          await tx.update(products).set({
            quantity: newQuantity,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(products.id, item.productId));
        }
      }
      return invoice;
    });
  }
  async updateInvoicePdfPath(id, pdfPath) {
    const [invoice] = await db.update(invoices).set({ pdfPath, updatedAt: /* @__PURE__ */ new Date() }).where(eq(invoices.id, id)).returning();
    return invoice;
  }
  async getInvoiceItems(invoiceId) {
    const result = await db.select().from(invoiceItems).leftJoin(products, eq(invoiceItems.productId, products.id)).where(eq(invoiceItems.invoiceId, invoiceId));
    return result.map((row) => ({
      ...row.invoice_items,
      product: row.products
    }));
  }
  async getInvoiceWithItems(id) {
    const invoice = await this.getInvoice(id);
    if (!invoice) return void 0;
    const items = await this.getInvoiceItems(id);
    return {
      ...invoice,
      items
    };
  }
  async updateInvoiceDiscount(id, discountAmount) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (invoice.status !== "Pending") {
      throw new Error("Can only update discount for pending invoices");
    }
    const subtotal = parseFloat(invoice.subtotal);
    const total = subtotal - discountAmount;
    const discountPercentage = subtotal > 0 ? discountAmount / subtotal : 0;
    const [updatedInvoice] = await db.update(invoices).set({
      discountPercentage: discountPercentage.toFixed(4),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: "0.00",
      total: total.toFixed(2),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(invoices.id, id)).returning();
    return updatedInvoice;
  }
  async addInvoiceItem(invoiceId, item) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (invoice.status !== "Pending") {
      throw new Error("Can only add items to pending invoices");
    }
    const [newItem] = await db.insert(invoiceItems).values({ ...item, invoiceId }).returning();
    await this.recalculateInvoiceTotals(invoiceId);
    return newItem;
  }
  async updateInvoiceItemQuantity(invoiceItemId, quantity) {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, invoiceItemId));
    if (!item) {
      throw new Error("Invoice item not found");
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, item.invoiceId));
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (invoice.status !== "Pending") {
      throw new Error("Can only update items in pending invoices");
    }
    const unitPrice = parseFloat(item.unitPrice);
    const totalPrice = (unitPrice * quantity).toFixed(2);
    const [updatedItem] = await db.update(invoiceItems).set({
      quantity,
      totalPrice
    }).where(eq(invoiceItems.id, invoiceItemId)).returning();
    await this.recalculateInvoiceTotals(item.invoiceId);
    return updatedItem;
  }
  async deleteInvoiceItem(invoiceItemId) {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, invoiceItemId));
    if (!item) {
      throw new Error("Invoice item not found");
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, item.invoiceId));
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (invoice.status !== "Pending") {
      throw new Error("Can only delete items from pending invoices");
    }
    await db.delete(invoiceItems).where(eq(invoiceItems.id, invoiceItemId));
    await this.recalculateInvoiceTotals(item.invoiceId);
  }
  async recalculateInvoiceTotals(invoiceId) {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const [currentInvoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    const discountAmount = parseFloat(currentInvoice?.discountAmount || "0");
    const total = subtotal - discountAmount;
    const [updatedInvoice] = await db.update(invoices).set({
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(invoices.id, invoiceId)).returning();
    return updatedInvoice;
  }
  // Activity log operations
  async createActivityLog(log2) {
    const [newLog] = await db.insert(activityLogs).values(log2).returning();
    return newLog;
  }
  async getActivityLogs(options) {
    const { limit = 50, offset = 0, userId, module, startDate, endDate } = options || {};
    const conditions = [];
    if (userId) {
      conditions.push(eq(activityLogs.userId, userId));
    }
    if (module) {
      conditions.push(eq(activityLogs.module, module));
    }
    if (startDate) {
      conditions.push(sql2`${activityLogs.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql2`${activityLogs.createdAt} <= ${endDate}`);
    }
    const whereCondition = conditions.length > 0 ? conditions.length === 1 ? conditions[0] : and(...conditions) : void 0;
    const [logsResult, totalResult] = await Promise.all([
      whereCondition ? db.select().from(activityLogs).leftJoin(users, eq(activityLogs.userId, users.id)).where(whereCondition).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset) : db.select().from(activityLogs).leftJoin(users, eq(activityLogs.userId, users.id)).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset),
      whereCondition ? db.select({ count: count() }).from(activityLogs).where(whereCondition) : db.select({ count: count() }).from(activityLogs)
    ]);
    const logs = logsResult.map((row) => ({
      ...row.activity_logs,
      user: row.users
    }));
    return {
      logs,
      total: totalResult[0].count
    };
  }
  // Dashboard metrics
  async getDashboardMetrics() {
    const [
      totalProductsResult,
      lowStockResult,
      pendingInvoicesResult,
      monthlyRevenueResult
    ] = await Promise.all([
      db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
      db.select({ count: count() }).from(products).where(
        and(eq(products.isActive, true), sql2`${products.quantity} <= 5`)
      ),
      db.select({ count: count() }).from(invoices).where(eq(invoices.status, "Pending")),
      db.select({
        total: sql2`COALESCE(SUM(${invoices.total}), 0)`
      }).from(invoices).where(
        and(
          eq(invoices.status, "Processed"),
          sql2`${invoices.createdAt} >= date_trunc('month', current_date)`
        )
      )
    ]);
    return {
      totalProducts: totalProductsResult[0].count,
      lowStockItems: lowStockResult[0].count,
      pendingInvoices: pendingInvoicesResult[0].count,
      monthlyRevenue: monthlyRevenueResult[0].total || 0
    };
  }
  async getManufacturerStats(options) {
    const conditions = [eq(invoices.status, "Processed")];
    if (options?.startDate && options?.endDate) {
      conditions.push(
        sql2`${invoices.createdAt} >= ${options.startDate}::timestamp`,
        sql2`${invoices.createdAt} <= ${options.endDate}::timestamp + interval '1 day'`
      );
    } else if (options?.range) {
      switch (options.range) {
        case "week":
          conditions.push(sql2`${invoices.createdAt} >= current_date - interval '7 days'`);
          break;
        case "month":
          conditions.push(sql2`${invoices.createdAt} >= current_date - interval '30 days'`);
          break;
        case "quarter":
          conditions.push(sql2`${invoices.createdAt} >= current_date - interval '3 months'`);
          break;
        case "year":
          conditions.push(sql2`${invoices.createdAt} >= current_date - interval '1 year'`);
          break;
      }
    }
    const stats = await db.select({
      manufacturer: sql2`COALESCE(NULLIF(${products.manufacturer}, ''), 'Unknown')`,
      totalQuantitySold: sql2`SUM(${invoiceItems.quantity})`,
      totalRevenue: sql2`SUM(${invoiceItems.totalPrice})`,
      productCount: sql2`COUNT(DISTINCT ${invoiceItems.productId})`
    }).from(invoiceItems).innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id)).innerJoin(products, eq(invoiceItems.productId, products.id)).where(and(...conditions)).groupBy(sql2`COALESCE(NULLIF(${products.manufacturer}, ''), 'Unknown')`).orderBy(sql2`SUM(${invoiceItems.quantity}) DESC`);
    return stats.map((stat) => ({
      manufacturer: stat.manufacturer,
      totalQuantitySold: Number(stat.totalQuantitySold),
      totalRevenue: parseFloat(String(stat.totalRevenue)),
      productCount: Number(stat.productCount)
    }));
  }
};
var storage = new DatabaseStorage();

// server/customAuth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcrypt";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    if (stored.startsWith("$2b$")) {
      return await bcrypt.compare(supplied, stored);
    }
    const parts = stored.split(".");
    if (parts.length !== 2) {
      return false;
    }
    const [hashed, salt] = parts;
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Set to true in production with HTTPS
      maxAge: sessionTtl
    }
  });
}
async function setupCustomAuth(app2) {
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password"
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }
          if (!user.isActive) {
            return done(null, false, { message: "Account is disabled" });
          }
          const isValidPassword = await comparePasswords(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid username or password" });
          }
          await storage.updateUserLastLogin(user.id);
          return done(null, user);
        } catch (error) {
          console.error("Authentication error:", error);
          return done(error);
        }
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("User deserialization error:", error);
      done(null, false);
    }
  });
}
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// server/routes.ts
import passport2 from "passport";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // Gets the public object search paths.
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  // Gets the private object directory.
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  // Search for a public object from the search paths.
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  // Downloads an object to the response.
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
import { z } from "zod";
import QRCode from "qrcode";
import { randomBytes as randomBytes2, createHash } from "crypto";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import multer from "multer";
import { createWorker } from "tesseract.js";
var uploadQRCodeToStorage = async (productId, qrCodeBuffer) => {
  try {
    const publicSearchPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",") || [];
    if (publicSearchPaths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not configured");
    }
    const publicPath = publicSearchPaths[0].trim();
    const { bucketName, objectName: basePath } = parseObjectPath2(publicPath);
    const qrCodeFileName = `qr-codes/${productId}.png`;
    const fullObjectPath = basePath ? `${basePath}/${qrCodeFileName}` : qrCodeFileName;
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(fullObjectPath);
    await file.save(qrCodeBuffer, {
      metadata: {
        contentType: "image/png",
        cacheControl: "public, max-age=3600"
      }
    });
    return `/public-objects/${qrCodeFileName}`;
  } catch (error) {
    console.error("Error uploading QR code to storage:", error);
    throw error;
  }
};
var parseObjectPath2 = (path3) => {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 2) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
};
var createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || process.env.GMAIL_USER || "default@gmail.com",
      pass: process.env.EMAIL_PASS || process.env.GMAIL_PASS || "defaultpass"
    }
  });
};
var sendWhatsAppMessage = async (to, pdfUrl) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || "default_sid";
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN || "default_token";
  const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
  const client = __require("twilio")(accountSid, authToken);
  try {
    await client.messages.create({
      body: `Your invoice is ready! Download it here: ${pdfUrl}`,
      from: twilioNumber,
      to: `whatsapp:${to}`
    });
  } catch (error) {
    console.error("WhatsApp send error:", error);
    throw new Error("Failed to send WhatsApp message");
  }
};
var logActivity = async (req, action, module, targetId, targetName, details) => {
  try {
    const userId = req.user?.id;
    await storage.createActivityLog({
      userId,
      action,
      module,
      targetId,
      targetName,
      details,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent")
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
var generateInvoicePDF = async (invoice, items) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.fontSize(20).text("INVOICE", 50, 50);
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 50, 80);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50, 95);
    doc.text("Bill To:", 50, 130);
    doc.text(invoice.customerName, 50, 145);
    doc.text(invoice.customerEmail, 50, 160);
    if (invoice.customerPhone) doc.text(invoice.customerPhone, 50, 175);
    if (invoice.customerAddress) doc.text(invoice.customerAddress, 50, 190);
    const tableTop = 230;
    doc.text("Product", 50, tableTop);
    doc.text("Size", 200, tableTop);
    doc.text("Qty", 300, tableTop);
    doc.text("Price", 400, tableTop);
    doc.text("Total", 480, tableTop);
    let yPosition = tableTop + 20;
    items.forEach((item) => {
      doc.text(item.product.productName, 50, yPosition);
      doc.text(item.product.size, 200, yPosition);
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, 400, yPosition);
      doc.text(`$${parseFloat(item.totalPrice).toFixed(2)}`, 480, yPosition);
      yPosition += 20;
    });
    yPosition += 20;
    doc.text(`Subtotal: $${parseFloat(invoice.subtotal).toFixed(2)}`, 400, yPosition);
    if (invoice.discountAmount && parseFloat(invoice.discountAmount) > 0) {
      yPosition += 15;
      doc.text(`Discount: -$${parseFloat(invoice.discountAmount).toFixed(2)}`, 400, yPosition);
    }
    yPosition += 15;
    doc.fontSize(14).text(`Total: $${parseFloat(invoice.total).toFixed(2)}`, 400, yPosition);
    if (invoice.notes) {
      yPosition += 40;
      doc.fontSize(12).text("Notes:", 50, yPosition);
      doc.text(invoice.notes, 50, yPosition + 15);
      yPosition += 50;
    } else {
      yPosition += 40;
    }
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 15;
    doc.fontSize(12).text("Volume Fashion Collection", 50, yPosition, { align: "left" });
    yPosition += 20;
    doc.fontSize(9);
    doc.text("Address:", 50, yPosition);
    doc.text("4006-4008 Room, 5th Floor, Changjiang International Garment Building", 50, yPosition + 12);
    doc.text("No.931, Renmingbei Road, Yuexiu District, Guangzhou, China", 50, yPosition + 24);
    doc.text("Contact:", 300, yPosition);
    doc.text("Tel: +86 132 8868 9165", 300, yPosition + 12);
    doc.text("Email: info@volumefashion.com", 300, yPosition + 24);
    yPosition += 50;
    doc.fontSize(10).text("Thank you for your business!", 50, yPosition, { align: "center", width: 500 });
    doc.end();
  });
};
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});
var imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  // 10MB limit
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  await setupCustomAuth(app2);
  app2.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", (req, res, next) => {
    passport2.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid username or password" });
      }
      req.logIn(user, (err2) => {
        if (err2) {
          console.error("Session error:", err2);
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
      });
    })(req, res, next);
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.post("/api/auth/password/forgot", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const genericMessage = "If an account with that email exists, you will receive a password reset link.";
      const user = await storage.getUserByEmail(email);
      if (user) {
        const token = randomBytes2(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
        await storage.createPasswordResetToken(user.id, tokenHash, expiresAt);
        const transporter = createEmailTransporter();
        const resetLink = `${req.protocol}://${req.get("host")}/reset-password?token=${token}`;
        await transporter.sendMail({
          from: process.env.EMAIL_USER || "noreply@volumefashion.com",
          to: email,
          subject: "Volume Fashion - Password Reset Request",
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Volume Fashion account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetLink}" style="color: #007bff; text-decoration: none;">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>Volume Fashion Team</p>
          `
        });
      }
      res.json({ message: genericMessage });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });
  app2.post("/api/auth/password/validate", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const resetToken = await storage.findValidPasswordResetTokenByHash(tokenHash);
      if (resetToken) {
        res.json({ valid: true });
      } else {
        res.json({ valid: false });
      }
    } catch (error) {
      console.error("Token validation error:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });
  app2.post("/api/auth/password/reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const resetToken = await storage.findValidPasswordResetTokenByHash(tokenHash);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markPasswordResetTokenUsed(resetToken.id);
      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });
  app2.get("/api/reports/manufacturers", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, range } = req.query;
      const manufacturerStats = await storage.getManufacturerStats({
        startDate,
        endDate,
        range
      });
      res.json(manufacturerStats);
    } catch (error) {
      console.error("Error fetching manufacturer statistics:", error);
      res.status(500).json({ message: "Failed to fetch manufacturer statistics" });
    }
  });
  app2.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { page = "1", limit = "20", search, category, size, stockLevel } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await storage.getAllProducts({
        limit: parseInt(limit),
        offset,
        search,
        category,
        size,
        stockLevel
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/by-product-id/:productId", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProductByProductId(req.params.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product by productId:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  app2.get("/api/products/by-name/:name", isAuthenticated, async (req, res) => {
    try {
      const searchName = decodeURIComponent(req.params.name).toLowerCase();
      const result = await storage.getAllProducts({
        limit: 100,
        offset: 0,
        search: searchName
      });
      if (result.products && result.products.length > 0) {
        res.json(result.products[0]);
      } else {
        return res.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      console.error("Error fetching product by name:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  app2.post("/api/products/recognize-from-image", isAuthenticated, imageUpload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    try {
      const worker = await createWorker("eng");
      const { data: { text: text2 } } = await worker.recognize(req.file.buffer);
      await worker.terminate();
      const cleanedText = text2.trim();
      if (cleanedText.length < 2) {
        return res.status(400).json({ message: "Could not extract text from image" });
      }
      const result = await storage.getAllProducts({
        limit: 100,
        offset: 0,
        search: cleanedText.toLowerCase()
      });
      if (result.products && result.products.length > 0) {
        res.json({
          recognizedText: cleanedText,
          product: result.products[0]
        });
      } else {
        res.status(404).json({
          recognizedText: cleanedText,
          message: "Product not found"
        });
      }
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });
  app2.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  app2.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const existingProduct = await storage.getProductByProductId(validatedProduct.productId);
      if (existingProduct) {
        return res.status(400).json({ message: "Product ID already exists" });
      }
      const product = await storage.createProduct(validatedProduct);
      try {
        const qrCodeData = `${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/products/${product.id}`;
        const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
          type: "png",
          width: 300,
          margin: 2
        });
        const qrCodeUrl = await uploadQRCodeToStorage(product.id, qrCodeBuffer);
        await storage.updateProductQRCode(product.id, qrCodeUrl);
      } catch (qrError) {
        console.error("Error generating QR code:", qrError);
      }
      await logActivity(req, `Created product "${product.productName}"`, "Products", product.id, product.productName);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  app2.post("/api/products/bulk-upload", isAuthenticated, upload.single("csvFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file provided" });
      }
      const csvData = req.file.buffer.toString("utf8");
      const lines = csvData.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must contain header and at least one product row" });
      }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const expectedHeaders = ["Product ID", "Product Name", "Color", "Size", "Quantity", "Price", "Category", "Description"];
      const requiredHeaders = ["Product ID", "Product Name", "Color", "Size", "Quantity", "Price"];
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
      if (missingHeaders.length > 0) {
        return res.status(400).json({
          message: `Missing required headers: ${missingHeaders.join(", ")}`
        });
      }
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
          if (values.length < headers.length) {
            errors.push(`Row ${i}: Insufficient columns`);
            errorCount++;
            continue;
          }
          const productData = {};
          headers.forEach((header, index2) => {
            const value = values[index2] || "";
            switch (header) {
              case "Product ID":
                productData.productId = value;
                break;
              case "Product Name":
                productData.productName = value;
                break;
              case "Color":
                productData.color = value;
                break;
              case "Size":
                productData.size = value;
                break;
              case "Quantity":
                productData.quantity = parseInt(value) || 0;
                break;
              case "Price":
                productData.price = value;
                break;
              case "Category":
                productData.category = value || null;
                break;
              case "Description":
                productData.description = value || null;
                break;
            }
          });
          if (!productData.productId || !productData.productName || !productData.color || !productData.size || !productData.price) {
            errors.push(`Row ${i}: Missing required fields`);
            errorCount++;
            continue;
          }
          if (isNaN(parseFloat(productData.price))) {
            errors.push(`Row ${i}: Invalid price value`);
            errorCount++;
            continue;
          }
          const existingProduct = await storage.getProductByProductId(productData.productId);
          if (existingProduct) {
            errors.push(`Row ${i}: Product ID ${productData.productId} already exists`);
            errorCount++;
            continue;
          }
          const validatedProduct = insertProductSchema.parse(productData);
          const product = await storage.createProduct({
            ...validatedProduct,
            imageUrl: null
            // No image for bulk upload initially
          });
          await storage.createActivityLog({
            userId: req.user.id,
            action: "create",
            module: "product",
            targetId: product.id,
            targetName: product.productName,
            details: { message: `Bulk uploaded product: ${product.productName}` }
          });
          successCount++;
        } catch (error) {
          console.error(`Error processing row ${i}:`, error);
          errors.push(`Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`);
          errorCount++;
        }
      }
      res.json({
        message: `Bulk upload completed`,
        successCount,
        errorCount,
        errors: errors.slice(0, 10)
        // Return first 10 errors only
      });
    } catch (error) {
      console.error("Error in bulk upload:", error);
      res.status(500).json({ message: "Failed to process bulk upload" });
    }
  });
  app2.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const productId = req.params.id;
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, updates);
      await logActivity(req, `Updated product "${product.productName}"`, "Products", product.id, product.productName);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  app2.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.deleteProduct(req.params.id);
      await logActivity(req, `Deleted product "${product.productName}"`, "Products", product.id, product.productName);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  app2.post("/api/products/bulk", isAuthenticated, async (req, res) => {
    try {
      const { products: productData } = req.body;
      if (!Array.isArray(productData) || productData.length === 0) {
        return res.status(400).json({ message: "Invalid product data" });
      }
      const validatedProducts = productData.map(
        (p) => insertProductSchema.parse({ ...p, createdBy: req.user.id })
      );
      const duplicates = [];
      const uniqueProducts = [];
      for (const product of validatedProducts) {
        const existing = await storage.getProductByProductId(product.productId);
        if (existing) {
          duplicates.push(product.productId);
        } else {
          uniqueProducts.push(product);
        }
      }
      const createdProducts = uniqueProducts.length > 0 ? await storage.createBulkProducts(uniqueProducts) : [];
      await logActivity(req, `Bulk imported ${createdProducts.length} products`, "Products", void 0, void 0, {
        imported: createdProducts.length,
        duplicates: duplicates.length
      });
      res.json({
        imported: createdProducts.length,
        duplicates,
        products: createdProducts
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error bulk importing products:", error);
      res.status(500).json({ message: "Failed to import products" });
    }
  });
  app2.put("/api/products/:id/image", isAuthenticated, async (req, res) => {
    try {
      const productId = req.params.id;
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(imageUrl);
      await storage.updateProduct(productId, { imageUrl: normalizedPath });
      const qrCodeData = `${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/products/${productId}`;
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        type: "png",
        width: 300,
        margin: 2
      });
      const qrCodeUrl = await uploadQRCodeToStorage(productId, qrCodeBuffer);
      const updatedProduct = await storage.updateProductQRCode(productId, qrCodeUrl);
      await logActivity(req, `Updated image for product "${updatedProduct.productName}"`, "Products", productId, updatedProduct.productName);
      res.json({ product: updatedProduct });
    } catch (error) {
      console.error("Error updating product image:", error);
      res.status(500).json({ message: "Failed to update product image" });
    }
  });
  app2.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const { page = "1", limit = "20", status, startDate, endDate, customerName } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await storage.getAllInvoices({
        limit: parseInt(limit),
        offset,
        status,
        startDate,
        endDate,
        customerName
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });
  app2.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithItems(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });
  app2.post("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const { invoice: invoiceData, items: itemsData } = req.body;
      const validatedInvoice = insertInvoiceSchema.parse({
        ...invoiceData,
        createdBy: req.user.id
      });
      const validatedItems = itemsData.map(
        (item) => insertInvoiceItemSchema.parse(item)
      );
      const invoice = await storage.createInvoice(validatedInvoice, validatedItems);
      await logActivity(req, `Created invoice ${invoice.invoiceNumber}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  app2.put("/api/invoices/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const normalizedStatus = status?.toLowerCase();
      if (!["pending", "processed"].includes(normalizedStatus)) {
        return res.status(400).json({ message: "Invalid status. Only 'Pending' and 'Processed' are allowed" });
      }
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot modify deleted invoices" });
      }
      if (normalizedStatus === "processed" && !["Admin", "Manager"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Insufficient permissions to process invoices" });
      }
      const capitalizedStatus = normalizedStatus === "pending" ? "Pending" : "Processed";
      const updatedInvoice = await storage.updateInvoiceStatus(req.params.id, capitalizedStatus, userId);
      await logActivity(req, `Updated invoice ${updatedInvoice.invoiceNumber} status to ${capitalizedStatus}`, "Invoices", updatedInvoice.id, updatedInvoice.invoiceNumber);
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });
  app2.delete("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!["Admin"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Only admins can delete invoices" });
      }
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(409).json({ message: "Invoice is already deleted" });
      }
      const deletedInvoice = await storage.updateInvoiceStatus(req.params.id, "Deleted", userId);
      await logActivity(req, `Deleted invoice ${invoice.invoiceNumber}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.json({ message: "Invoice marked as deleted", invoice: deletedInvoice });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });
  app2.put("/api/invoices/:id/discount", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot modify deleted invoices" });
      }
      const { discountAmount } = req.body;
      const discountSchema = z.object({
        discountAmount: z.number().min(0)
      });
      const { discountAmount: validatedDiscount } = discountSchema.parse({ discountAmount });
      const updatedInvoice = await storage.updateInvoiceDiscount(req.params.id, validatedDiscount);
      await logActivity(req, `Updated invoice ${updatedInvoice.invoiceNumber} discount to $${validatedDiscount.toFixed(2)}`, "Invoices", updatedInvoice.id, updatedInvoice.invoiceNumber);
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid discount amount", errors: error.errors });
      }
      console.error("Error updating invoice discount:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update invoice discount" });
    }
  });
  app2.post("/api/invoices/:id/items", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot modify deleted invoices" });
      }
      if (invoice.status?.toLowerCase() !== "pending") {
        return res.status(403).json({ message: "Can only add items to pending invoices" });
      }
      const { productId, quantity, unitPrice } = req.body;
      const itemSchema = z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0)
      });
      const validatedItem = itemSchema.parse({ productId, quantity, unitPrice });
      const totalPrice = validatedItem.unitPrice * validatedItem.quantity;
      const newItem = await storage.addInvoiceItem(req.params.id, {
        productId: validatedItem.productId,
        quantity: validatedItem.quantity,
        unitPrice: validatedItem.unitPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2)
      });
      await logActivity(req, `Added item to invoice ${invoice.invoiceNumber}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid item data", errors: error.errors });
      }
      console.error("Error adding invoice item:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to add invoice item" });
    }
  });
  app2.put("/api/invoices/:invoiceId/items/:itemId", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot modify deleted invoices" });
      }
      if (invoice.status?.toLowerCase() !== "pending") {
        return res.status(403).json({ message: "Can only update items in pending invoices" });
      }
      const { quantity } = req.body;
      const quantitySchema = z.object({
        quantity: z.number().min(1)
      });
      const { quantity: validatedQuantity } = quantitySchema.parse({ quantity });
      const updatedItem = await storage.updateInvoiceItemQuantity(req.params.itemId, validatedQuantity);
      await logActivity(req, `Updated item quantity in invoice ${invoice.invoiceNumber}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quantity", errors: error.errors });
      }
      console.error("Error updating invoice item:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update invoice item" });
    }
  });
  app2.delete("/api/invoices/:invoiceId/items/:itemId", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot modify deleted invoices" });
      }
      if (invoice.status?.toLowerCase() !== "pending") {
        return res.status(403).json({ message: "Can only delete items from pending invoices" });
      }
      await storage.deleteInvoiceItem(req.params.itemId);
      await logActivity(req, `Deleted item from invoice ${invoice.invoiceNumber}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete invoice item" });
    }
  });
  app2.post("/api/invoices/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithItems(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot generate PDF for deleted invoices" });
      }
      if (invoice.status !== "Processed") {
        return res.status(400).json({ message: "Can only generate PDF for processed invoices" });
      }
      const pdfBuffer = await generateInvoicePDF(invoice, invoice.items);
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        "Content-Length": pdfBuffer.length
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });
  app2.post("/api/invoices/:id/email", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithItems(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot email deleted invoices" });
      }
      if (invoice.status !== "Processed") {
        return res.status(400).json({ message: "Can only email processed invoices" });
      }
      if (!invoice.customerEmail) {
        return res.status(400).json({ message: "Customer email is required to send invoice" });
      }
      const pdfBuffer = await generateInvoicePDF(invoice, invoice.items);
      const transporter = createEmailTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER || "noreply@fashionhub.com",
        to: invoice.customerEmail,
        subject: `Invoice ${invoice.invoiceNumber} - FashionHub`,
        html: `
          <h2>Your Invoice is Ready</h2>
          <p>Dear ${invoice.customerName},</p>
          <p>Please find your invoice ${invoice.invoiceNumber} attached.</p>
          <p>Total Amount: $${parseFloat(invoice.total).toFixed(2)}</p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>FashionHub Team</p>
        `,
        attachments: [
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      });
      await logActivity(req, `Sent invoice ${invoice.invoiceNumber} via email to ${invoice.customerEmail}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });
  app2.post("/api/invoices/:id/whatsapp", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithItems(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (invoice.status?.toLowerCase() === "deleted") {
        return res.status(403).json({ message: "Cannot send deleted invoices via WhatsApp" });
      }
      if (invoice.status !== "Processed") {
        return res.status(400).json({ message: "Can only send processed invoices via WhatsApp" });
      }
      if (!invoice.customerPhone) {
        return res.status(400).json({ message: "Customer phone number is required for WhatsApp" });
      }
      const pdfUrl = `${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000"}/api/invoices/${invoice.id}/pdf`;
      await sendWhatsAppMessage(invoice.customerPhone, pdfUrl);
      await logActivity(req, `Sent invoice ${invoice.invoiceNumber} via WhatsApp to ${invoice.customerPhone}`, "Invoices", invoice.id, invoice.invoiceNumber);
      res.json({ message: "WhatsApp message sent successfully" });
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      res.status(500).json({ message: "Failed to send WhatsApp message" });
    }
  });
  app2.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== "Admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.put("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== "Admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      await logActivity(req, `Updated user ${user?.email} role to ${role}`, "Users", user?.id || void 0, user?.email || void 0);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.put("/api/users/:id/status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== "Admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { isActive } = req.body;
      const user = await storage.updateUserStatus(req.params.id, isActive);
      await logActivity(req, `${isActive ? "Activated" : "Deactivated"} user ${user?.email}`, "Users", user?.id || void 0, user?.email || void 0);
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app2.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      if (currentUser?.role !== "Admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { email, firstName, lastName, role, username, password } = req.body;
      const user = await storage.upsertUser({
        username: username || email,
        // Use username or fallback to email
        password: password || "defaultPassword123",
        // Temporary password
        email,
        firstName,
        lastName,
        role: role || "Viewer",
        isActive: true
      });
      await logActivity(req, `Created user account for ${email}`, "Users", user.id, email);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.get("/api/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const { page = "1", limit = "50", userId, module, startDate, endDate } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await storage.getActivityLogs({
        limit: parseInt(limit),
        offset,
        userId,
        module,
        startDate,
        endDate
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
