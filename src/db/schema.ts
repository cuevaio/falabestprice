import { relations, sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  uniqueIndex,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const brands = pgTable("brands", {
  id: integer("id").primaryKey(),
  name: varchar("name", {
    length: 255,
  }).notNull(),
});

export type InsertBrand = InferInsertModel<typeof brands>;

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const products = pgTable("products", {
  id: integer("id").primaryKey(),
  brandId: integer("brand_id")
    .references(() => brands.id)
    .notNull(),
  name: varchar("name", {
    length: 255,
  }).notNull(),
  isDeprecated: boolean("is_deprecated").notNull().default(false),
});

export type InsertProduct = InferInsertModel<typeof products>;

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(variants),
}));

export const variants = pgTable("variants", {
  id: integer("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  size: varchar("size", {
    length: 255,
  }).notNull(),
  color: jsonb("color").$type<{ name: string; code: string }>(),
  assets: jsonb("assets")
    .array()
    .notNull()
    .default(sql`ARRAY[]::jsonb[]`)
    .$type<{ type: string; url: string }[]>(),
  isDeprecated: boolean("is_deprecated").notNull().default(false),
});

export type InsertVariant = InferInsertModel<typeof variants>;

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  prices: many(prices),
}));

export const prices = pgTable("prices", {
  id: varchar("id", {
    length: 12,
  }).primaryKey(),
  variantId: integer("variant_id").references(() => variants.id),
  price: real("price"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  inStock: boolean("in_stock").notNull(),
});

export type InsertPrice = InferInsertModel<typeof prices>;

export const pricesRelations = relations(prices, ({ one }) => ({
  variant: one(variants, {
    fields: [prices.variantId],
    references: [variants.id],
  }),
}));
