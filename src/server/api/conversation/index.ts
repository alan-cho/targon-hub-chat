import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { Conversation, Message } from "@/schema/schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const conversationRouter = createTRPCRouter({
  // Fetch All Conversations for the Current User
  getConversations: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not Authenticated",
      });
    }

    try {
      const conversations = await ctx.db
        .select({
          id: Conversation.id,
          title: Conversation.title,
          createdAt: Conversation.createdAt,
        })
        .from(Conversation)
        .where(eq(Conversation.userId, ctx.user.id))
        .orderBy(desc(Conversation.createdAt));

      return conversations ?? [];
    } catch (e) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed fetching conversations",
      });
    }
  }),

  // Fetch All Messages in a Specific Conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const messages = await ctx.db
          .select({
            id: Message.id,
            message: Message.message,
            sender: Message.sender,
            createdAt: Message.createdAt,
          })
          .from(Message)
          .where(eq(Message.conversationId, input.conversationId))
          .orderBy(asc(Message.createdAt));

        return messages ?? [];
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed fetching messages",
        });
      }
    }),

  // Create a New Conversation
  createConversation: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createConversation = await ctx.db
        .insert(Conversation)
        .values({
          title: input.title,
          userId: ctx.user.id,
          createdAt: new Date(),
        })
        .$returningId();

      // Drizzle ORM doesn't support .returning() on MySQL databases yet, only PostgresQL and SQLite...
      const conversationId = createConversation[0]?.id;
      if (!conversationId)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });

      const newConversation = await ctx.db
        .select()
        .from(Conversation)
        .where(eq(Conversation.id, conversationId));

      return { success: true, conversation: newConversation[0] };
    }),

  // Add a Message to the Conversation
  addMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(4000),
        sender: z.enum(["user", "assistant"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const newMessage = await ctx.db.insert(Message).values({
          conversationId: input.conversationId,
          message: input.message,
          sender: input.sender,
          createdAt: new Date(),
        });

        return { success: true, message: newMessage };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add message",
        });
      }
    }),

  // Delete a Conversation
  deleteConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(Conversation)
        .where(
          and(
            eq(Conversation.id, input.conversationId),
            eq(Conversation.userId, ctx.user.id),
          ),
        );

      return { success: true };
    }),
});
