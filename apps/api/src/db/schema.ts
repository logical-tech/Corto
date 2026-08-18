import { relations, sql } from "drizzle-orm"
import {
  bigint,
  bigserial,
  boolean,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires", { withTimezone: true }),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonatedBy"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const twoFactor = pgTable(
  "twoFactor",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backupCodes").notNull(),
    verified: boolean("verified").default(true).notNull(),
    failedVerificationCount: integer("failedVerificationCount")
      .default(0)
      .notNull(),
    lockedUntil: timestamp("lockedUntil", { withTimezone: true }),
  },
  (table) => [index("twoFactor_userId_idx").on(table.userId)]
)

export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("publicKey").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credentialID").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("deviceType").notNull(),
    backedUp: boolean("backedUp").notNull(),
    transports: text("transports"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    aaguid: text("aaguid"),
  },
  (table) => [
    index("passkey_userId_idx").on(table.userId),
    index("passkey_credentialID_idx").on(table.credentialID),
  ]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const apikey = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    configId: text("configId").default("default").notNull(),
    name: text("name"),
    start: text("start"),
    referenceId: text("referenceId").notNull(),
    prefix: text("prefix"),
    key: text("key").notNull(),
    refillInterval: integer("refillInterval"),
    refillAmount: integer("refillAmount"),
    lastRefillAt: timestamp("lastRefillAt", { withTimezone: true }),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rateLimitEnabled").default(true),
    rateLimitTimeWindow: integer("rateLimitTimeWindow").default(86_400_000),
    rateLimitMax: integer("rateLimitMax").default(10),
    requestCount: integer("requestCount").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("lastRequest", { withTimezone: true }),
    expiresAt: timestamp("expiresAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikey_configId_idx").on(table.configId),
    index("apikey_referenceId_idx").on(table.referenceId),
    index("apikey_key_idx").on(table.key),
  ]
)

export const shortLinks = pgTable(
  "short_links",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    url: text("url").notNull(),
    title: varchar("title", { length: 200 }),
    active: boolean("active").default(true).notNull(),
    adFree: boolean("ad_free").default(false).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    clickLimit: bigint("click_limit", { mode: "number" }),
    passwordHash: text("password_hash"),
    clicks: bigint("clicks", { mode: "number" }).default(0).notNull(),
    lastClickedAt: timestamp("last_clicked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("short_links_user_created_idx").on(table.userId, table.createdAt),
  ]
)

export const advertisingSettings = pgTable(
  "advertising_settings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").default(false).notNull(),
    automaticRedirect: boolean("automatic_redirect").default(false).notNull(),
    delaySeconds: smallint("delay_seconds").default(5).notNull(),
    provider: varchar("provider", { length: 32 }).default("adsterra").notNull(),
    adsterraBanners: text("adsterra_banners").default("[]").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "advertising_settings_delay_seconds",
      sql`${table.delaySeconds} BETWEEN 1 AND 60`
    ),
  ]
)

export const linkClicks = pgTable(
  "link_clicks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => shortLinks.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    country: varchar("country", { length: 2 }),
    device: varchar("device", { length: 16 }).notNull(),
  },
  (table) => [
    index("link_clicks_link_time_idx").on(table.linkId, table.clickedAt),
  ]
)

export const linkGoals = pgTable(
  "link_goals",
  {
    id: text("id").primaryKey(),
    linkId: text("link_id")
      .notNull()
      .references(() => shortLinks.id, { onDelete: "cascade" }),
    clicks: bigint("clicks", { mode: "number" }).notNull(),
    reachedAt: timestamp("reached_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("link_goals_link_clicks_unique").on(table.linkId, table.clicks),
    index("link_goals_link_clicks_idx").on(table.linkId, table.clicks),
  ]
)

export const appSettings = pgTable(
  "app_settings",
  {
    id: smallint("id").primaryKey(),
    registrationEnabled: boolean("registration_enabled")
      .default(true)
      .notNull(),
    discordWebhookUrl: text("discord_webhook_url"),
    telegramBotToken: text("telegram_bot_token"),
    telegramChatId: text("telegram_chat_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check("app_settings_singleton", sql`${table.id} = 1`)]
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactors: many(twoFactor),
  passkeys: many(passkey),
  shortLinks: many(shortLinks),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, { fields: [twoFactor.userId], references: [user.id] }),
}))

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, { fields: [passkey.userId], references: [user.id] }),
}))

export const shortLinksRelations = relations(shortLinks, ({ one, many }) => ({
  user: one(user, { fields: [shortLinks.userId], references: [user.id] }),
  clicks: many(linkClicks),
  goals: many(linkGoals),
}))

export const advertisingSettingsRelations = relations(
  advertisingSettings,
  ({ one }) => ({
    user: one(user, {
      fields: [advertisingSettings.userId],
      references: [user.id],
    }),
  })
)

export const linkClicksRelations = relations(linkClicks, ({ one }) => ({
  link: one(shortLinks, {
    fields: [linkClicks.linkId],
    references: [shortLinks.id],
  }),
}))

export const linkGoalsRelations = relations(linkGoals, ({ one }) => ({
  link: one(shortLinks, {
    fields: [linkGoals.linkId],
    references: [shortLinks.id],
  }),
}))
