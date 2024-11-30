"use client";

import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

interface Conversation {
  id: number;
  title: string | null;
  createdAt: Date;
}

interface PlaygroundSidebarProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
}

export default function PlaygroundSidebar({
  conversations,
  selectedConversationId,
}: PlaygroundSidebarProps) {
  const router = useRouter();
  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-100 p-4 pt-16">
      <button
        onClick={() => router.push(`/playground`)}
        className="mb-2 flex items-center gap-2 rounded-lg px-4 py-2 text-gray-900 hover:bg-orange-400"
      >
        <PlusIcon className="h-4 w-4" />
        <span className="text-sm font-semibold">New Chat</span>
      </button>

      <h2 className="text-lg font-semibold">Conversations</h2>
      <ul className="mt-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              className={`w-full truncate rounded-lg px-1 py-1 pl-4 pr-4 text-left text-sm hover:text-white ${conversation.id === selectedConversationId ? "bg-gray-500 text-white" : "text-gray-900 hover:bg-orange-400"}`}
              onClick={() => router.push(`/playground/${conversation.id}`)}
            >
              {conversation.title}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center">
        <h2 className="text-lg font-semibold">Model Parameters</h2>
      </div>
    </aside>
  );
}

/*
  Display Conversations

  Parameters at the bottom
*/
