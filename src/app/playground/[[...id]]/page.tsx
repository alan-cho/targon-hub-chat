"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  SendHorizonalIcon,
  TrashIcon,
} from "lucide-react";
import OpenAI from "openai";
import {
  type ChatCompletionAssistantMessageParam,
  type ChatCompletionMessageParam,
  type ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";
import Markdown from "react-markdown";
import { toast } from "sonner";

import { useAuth } from "@/app/_components/providers";
import Slider from "@/app/_components/Slider";
import { env } from "@/env.mjs";
import { reactClient } from "@/trpc/react";

export default function ConversationPage() {
  const auth = useAuth();
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsloading] = useState(false);
  const [text, setText] = useState("");
  const [chats, setChats] = useState<Array<ChatCompletionMessageParam>>([]);

  // States for the Model Configuration
  const [maxTokens, setMaxTokens] = useState(1024);
  const [topP, setTopP] = useState(0.99);
  const [temperature, setTemperature] = useState(1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.01);
  const [presencePenalty, setPresencePenalty] = useState(0.01);
  const [stopSequence, setStopSequence] = useState<string[]>([]);

  const { data: conversations, refetch } =
    reactClient.conversation.getConversations.useQuery();
  const { id } = useParams<{ id: string }>();
  let selectedConversationId = id ? Number(id) : null;

  // Initialize Client
  const models = reactClient.model.getActiveChatModels.useQuery();
  const keys = reactClient.core.getApiKeys.useQuery();
  // Added Key for Personal Development
  const first_key = env.NEXT_PUBLIC_HF_API_KEY;
  // const first_key = keys.data?.[0]?.key ?? "";
  const current_model = selected ?? models.data?.[0]?.name ?? null;
  const client = useMemo(() => {
    return new OpenAI({
      baseURL: env.NEXT_PUBLIC_HUB_API_ENDPOINT + "/v1",
      apiKey: first_key,
      dangerouslyAllowBrowser: true,
    });
  }, [first_key]);

  // Load Messages
  const { data: messages } = selectedConversationId
    ? reactClient.conversation.getMessages.useQuery({
        conversationId: selectedConversationId,
      })
    : { data: [] };

  // Converts the Previous Conversation Messages Typing for OpenAI's Client
  useEffect(() => {
    if (messages?.length) {
      const convertedMessages: ChatCompletionMessageParam[] = messages.map(
        (msg) => {
          if (msg.sender === "user") {
            return {
              role: "user",
              content: msg.message,
            } as ChatCompletionUserMessageParam;
          }
          return {
            role: "assistant",
            content: msg.message,
          } as ChatCompletionAssistantMessageParam;
        },
      );

      setChats(convertedMessages);
    }
  }, [messages]);

  const trigger = useCallback(
    async (chat: string, chatlog: typeof chats) => {
      if (!current_model) return;
      setText("");
      setIsloading(true);

      setChats((c) => [...c, { role: "user", content: chat }]);
      const stream = await client.chat.completions.create({
        stream: true,
        messages: [...chatlog, { role: "user", content: chat }],
        model: current_model,
        max_tokens: maxTokens,
        temperature: temperature,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        top_p: topP,
        stop: stopSequence,
      });

      let assistantMessage = "";
      setChats((c) => [...c, { role: "assistant", content: "" }]);
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        assistantMessage += content;
        setChats((c) => {
          const cc = structuredClone(c);
          cc[cc.length - 1]!.content =
            ((cc[cc.length - 1]?.content as string) ?? "") + content;
          return cc;
        });
      }

      if (!selectedConversationId) {
        const title = await generateTitle(chat, assistantMessage);
        selectedConversationId = (await createConversation(title)).conversation!
          .id;
      }

      if (selectedConversationId) {
        await addMessage(selectedConversationId, chat, "user");
        await addMessage(selectedConversationId, assistantMessage, "assistant");
      }

      setIsloading(false);
    },
    [client, current_model],
  );

  const generateTitle = async (user: string, assistant: string) => {
    const response = await client.chat.completions.create({
      model: current_model!,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `Based on this conversation, summarize the topic. Limit to 1-6 words:
            User: ${user}
            Assistant: ${assistant}`,
        },
      ],
      max_tokens: 50,
    });

    const title = response.choices[0]?.message?.content?.trim() || "New Chat";
    return title;
  };

  const createConversationMutation =
    reactClient.conversation.createConversation.useMutation({
      onSuccess: (conversation) => {
        router.replace(`/playground/${conversation.conversation!.id}`);
      },
    });

  const createConversation = async (title: string) => {
    return await createConversationMutation.mutateAsync({
      title: title,
    });
  };

  const addMessageMutation = reactClient.conversation.addMessage.useMutation({
    onError: (e) => {
      toast.error(`Failed to Add Message: ${e.message}`);
    },
  });

  const addMessage = async (
    conversationId: number,
    message: string,
    sender: "user" | "assistant",
  ) => {
    return await addMessageMutation.mutateAsync({
      conversationId: conversationId,
      message: message,
      sender: sender,
    });
  };

  const deleteConversationMutation =
    reactClient.conversation.deleteConversation.useMutation({
      onSuccess: () => {
        router.replace("/playground");
        toast.info("Conversation successfully deleted");
      },
    });

  const deleteConversation = async (id: number) => {
    await deleteConversationMutation.mutateAsync({
      conversationId: id,
    });
    await refetch();
    return;
  };

  if (auth.status === "UNAUTHED") router.push("/sign-in");

  if (keys.data?.length === 0) {
    return (
      <div>
        Looks like you dont have any api keys! Go make one and come back
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-full flex-grow">
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-100 p-4 pt-16">
        <div>
          <h2 className="flex items-center text-lg font-semibold">
            Conversations
          </h2>
          <ul className="mt-2 max-h-[calc(100vh-100px)] overflow-y-auto">
            {!conversations
              ? "Loading..."
              : conversations.map((conversation) => (
                  <li
                    key={conversation.id}
                    className="relative flex items-center"
                  >
                    <button
                      className={`w-full truncate rounded-lg px-1 py-1 pl-2 pr-9 ${conversation.id === selectedConversationId ? "bg-gray-500 text-white" : "hover:bg-orange-400"}`}
                      onClick={() =>
                        router.push(`/playground/${conversation.id}`)
                      }
                    >
                      <span
                        className={`block w-full truncate text-left text-sm ${conversation.id === selectedConversationId ? "text-white" : "text-gray-900"}`}
                      >
                        {conversation.title}
                      </span>
                    </button>
                    <button
                      className={`absolute right-0 rounded-lg p-1 ${conversation.id === selectedConversationId ? "text-gray-200 hover:text-white" : "text-gray-600 hover:text-gray-500"}`}
                    >
                      <TrashIcon
                        className="h-4 w-4"
                        onClick={() => deleteConversation(conversation.id)}
                      />
                    </button>
                  </li>
                ))}
          </ul>
          <button
            onClick={() => router.push(`/playground`)}
            className="w-24 items-center justify-center rounded-lg bg-orange-500 p-1 text-center text-sm text-white hover:bg-orange-400"
          >
            New Chat
          </button>
        </div>
        {/* Model Parameters */}
        <div className="mt-6">
          <div className="mt-2 flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Model Configuration</h3>

            {/* Model Selection */}
            <div>
              <Listbox value={current_model} onChange={setSelected}>
                <label className="block text-sm/6 font-medium text-gray-900">
                  Model
                </label>
                <div className="relative mt-2">
                  <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm/6">
                    <span className="block truncate">
                      {models.isLoading ? "Loading..." : current_model}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronsUpDownIcon
                        aria-hidden="true"
                        className="size-5 text-gray-400"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions
                    transition
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
                  >
                    {models.data?.map((model) => (
                      <ListboxOption
                        key={model.name}
                        value={model.name}
                        className="group relative cursor-default select-none py-2 pl-8 pr-4 text-gray-900 data-[focus]:bg-orange-600 data-[focus]:text-white"
                      >
                        <span className="block truncate font-normal group-data-[selected]:font-semibold">
                          {model.name}
                        </span>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-orange-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                          <CheckIcon aria-hidden="true" className="size-5" />
                        </span>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {/* Temperature Slider */}
            <Slider
              id="temperature"
              label="Temperature"
              value={temperature}
              min={0.01}
              max={1.99}
              step={0.01}
              defaultValue={1}
              onChange={setTemperature}
            />

            {/* Max Tokens */}
            <Slider
              id="max-tokens"
              label="Max Tokens"
              value={maxTokens}
              min={1}
              max={2048}
              step={1}
              defaultValue={1024}
              onChange={setMaxTokens}
            />

            {/* Stop Sequences */}
            <div>
              <label
                htmlFor="stop-sequences"
                className="block text-sm font-medium text-gray-700"
              >
                Stop Sequences
              </label>
              <input
                id="stop-sequences"
                type="text"
                placeholder="Enter up to four sequences"
                onChange={(e) => {
                  const sequences = e.target.value
                    .trim()
                    .split(/\s+/)
                    .slice(0, 4);
                  setStopSequence(sequences);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
              />
            </div>

            {/* Top P Slider */}
            <Slider
              id={"top-p"}
              label={"Top P"}
              value={topP}
              min={0.01}
              max={0.99}
              step={0.01}
              defaultValue={0.99}
              onChange={setTopP}
            />

            {/* Frequency Penalty Slider */}
            <Slider
              id={"frequency-penalty"}
              label={"Frequency Penalty"}
              value={frequencyPenalty}
              min={0.01}
              max={1.99}
              step={0.01}
              defaultValue={0.01}
              onChange={setFrequencyPenalty}
            />

            {/* Presence Penalty Slider */}
            <Slider
              id={"presence-penalty"}
              label={"Presence Penalty"}
              value={presencePenalty}
              min={0.01}
              max={1.99}
              step={0.01}
              defaultValue={0.01}
              onChange={setPresencePenalty}
            />
          </div>
        </div>
      </aside>
      <div className="relative mx-auto flex max-w-2xl flex-grow flex-col justify-between gap-1 overflow-hidden px-5 pb-4 pt-12">
        <div>
          <Listbox value={current_model} onChange={setSelected}>
            <Label className="block text-sm/6 font-medium text-gray-900">
              Model
            </Label>
            <div className="relative mt-2">
              <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm/6">
                <span className="block truncate">
                  {models.isLoading ? "Loading..." : current_model}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDownIcon
                    aria-hidden="true"
                    className="size-5 text-gray-400"
                  />
                </span>
              </ListboxButton>

              <ListboxOptions
                transition
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
              >
                {models.data?.map((model) => (
                  <ListboxOption
                    key={model.name}
                    value={model.name}
                    className="group relative cursor-default select-none py-2 pl-8 pr-4 text-gray-900 data-[focus]:bg-orange-600 data-[focus]:text-white"
                  >
                    <span className="block truncate font-normal group-data-[selected]:font-semibold">
                      {model.name}
                    </span>

                    <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-orange-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                      <CheckIcon aria-hidden="true" className="size-5" />
                    </span>
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        </div>
        {/* We use h-0 to trick flex into overflow scrolling when it hits max h
      after growing from flex
      */}
        <div className="relative h-0 flex-grow">
          <div className="relative h-full overflow-y-scroll">
            <ul className="grid grid-cols-1 space-y-5">
              {chats.map((c, i) => (
                <div
                  key={i}
                  className={`${c.role === "user" ? "place-self-end" : "place-self-start"} space-y-2`}
                >
                  <div
                    className={`max-w-[100%] rounded-2xl px-4 py-2 text-sm ${
                      c.role === "user"
                        ? "self-end bg-orange-600 text-white"
                        : "self-start bg-gray-200 text-gray-900"
                    }`}
                  >
                    <Markdown>{c.content as string}</Markdown>
                  </div>
                </div>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <label
            htmlFor="comment"
            className="block text-sm/6 font-medium text-gray-900"
          >
            Chat
          </label>
          <div className="my-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              id="comment"
              name="comment"
              rows={3}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm/6"
            />
          </div>
          <button
            onClick={() => trigger(text, chats)}
            disabled={isLoading}
            type="button"
            className="align-center inline-flex w-full items-center justify-center gap-3 rounded-md bg-orange-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            Send Chat
            <SendHorizonalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
