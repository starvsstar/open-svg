import { Configuration, OpenAIApi } from "openai";

export class SVGGenerator {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async generateSVG(prompt: string): Promise<string> {
    // 实现 SVG 生成逻辑
    return "";
  }
} 