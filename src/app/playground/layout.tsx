"use client";

import { useParams } from "next/navigation";

import { reactClient } from "@/trpc/react";
import PlaygroundSidebar from "../_components/PlaygroundSidebar";
import ConversationPage from "./[[...id]]/page";

export default function PlaygroundLayout() {
  const { data: conversations } =
    reactClient.conversation.getConversations.useQuery();
  const { id } = useParams<{ id: string }>();
  const conversationId = id ? Number(id) : null;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <PlaygroundSidebar
        conversations={conversations || []}
        selectedConversationId={conversationId}
      />
      {/* Main Content */}
      <ConversationPage conversationId={conversationId} key={conversationId} />
      {/* Spacer Div to Center Chat */}
      <div className="w-64 flex-shrink-0"></div>
    </div>
  );
}
