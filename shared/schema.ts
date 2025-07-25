import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  players: jsonb("players").default([]).$type<string[]>(),
  matches: integer("matches").default(0),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull(), // batsman, bowler, all-rounder, wicket-keeper
  teamId: varchar("team_id"),
  matches: integer("matches").default(0),
  runs: integer("runs").default(0),
  ballsFaced: integer("balls_faced").default(0),
  fours: integer("fours").default(0),
  sixes: integer("sixes").default(0),
  fifties: integer("fifties").default(0),
  hundreds: integer("hundreds").default(0),
  highScore: integer("high_score").default(0),
  wickets: integer("wickets").default(0),
  ballsBowled: integer("balls_bowled").default(0),
  runsConceded: integer("runs_conceded").default(0),
  maidens: integer("maidens").default(0),
  bestBowling: text("best_bowling").default("0/0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  team1Id: varchar("team1_id").notNull(),
  team2Id: varchar("team2_id").notNull(),
  team1Name: text("team1_name").notNull(),
  team2Name: text("team2_name").notNull(),
  format: text("format").notNull(), // T20, ODI, Test
  venue: text("venue"),
  date: timestamp("date").defaultNow(),
  status: text("status").default("not_started"), // not_started, in_progress, completed
  tossWinner: varchar("toss_winner"),
  tossDecision: text("toss_decision"), // bat, bowl
  team1Score: integer("team1_score").default(0),
  team1Wickets: integer("team1_wickets").default(0),
  team1Overs: real("team1_overs").default(0),
  team2Score: integer("team2_score").default(0),
  team2Wickets: integer("team2_wickets").default(0),
  team2Overs: real("team2_overs").default(0),
  winner: varchar("winner"),
  result: text("result"),
  currentInnings: integer("current_innings").default(1),
  battingTeam: varchar("batting_team"),
  bowlingTeam: varchar("bowling_team"),
  currentBatsman1: varchar("current_batsman1"),
  currentBatsman2: varchar("current_batsman2"),
  currentBowler: varchar("current_bowler"),
  onStrike: varchar("on_strike"),
  ballByBall: jsonb("ball_by_ball").default([]).$type<any[]>(),
  playerStats: jsonb("player_stats").default({}).$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
