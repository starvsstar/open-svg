export type ModelProvider = {
  id: string;
  name: string;
  models: {
    id: string;
    name: string;
    tags?: string[];
  }[];
};

export const AI_MODELS: ModelProvider[] = [
  {
    id: "gpt",
    name: "GPT",
    models: [
      
      {
        id: "gpt-4-mini",
        name: "GPT-4 Mini",
        tags: ["premium"]
      }
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: [
      {
        id: "DeepSeek-V3",
        name: "DeepSeek-V3"
      },
      {
        id: "DeepSeek-R1", 
        name: "DeepSeek-R1",
        tags: ["premium"]
      }
    ]
  }
]; 