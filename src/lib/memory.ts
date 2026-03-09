import { BufferMemory } from "langchain/memory";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";

// 创建一个 Map 来存储不同会话的内存
const memoryMap = new Map<string, BufferMemory>();

export function getMemory(sessionId: string): BufferMemory {
  if (!memoryMap.has(sessionId)) {
    // 为新会话创建内存
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
    });
    memoryMap.set(sessionId, memory);
  }
  return memoryMap.get(sessionId)!;
}

// 清除特定会话的内存
export function clearMemory(sessionId: string): void {
  memoryMap.delete(sessionId);
} 