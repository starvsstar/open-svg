import { NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { getLLMConfig } from '@/lib/llm-config'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { encode } from 'gpt-tokenizer'
import { getMemory } from '@/lib/memory'

function getWordCount(text: string): number {
  text = text.replace(/```[\s\S]*?```/g, '')
  text = text.replace(/\[.*?\]\(.*?\)/g, '')
  text = text.replace(/[#*_~`]/g, '')
  
  const englishWords = text.match(/[a-zA-Z]+/g)?.length || 0
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  
  return englishWords + chineseChars
}

/**
 * @swagger
 * /api/generate:
 *   post:
 *     summary: 生成AI回复
 *     tags: [AI生成]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateRequest'
 *     responses:
 *       200:
 *         description: 成功生成回复（流式响应）
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: 流式返回生成的文本内容，最后附带统计信息
 *             example: |
 *               这是生成的内容...
 *               
 *               ---
 *               Stats: 100 words, 150 tokens, model: gpt-3.5-turbo, time: 2000ms
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: 错误信息
 */

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const { messages, prompts, sessionId = 'default' } = await request.json()
    const config = getLLMConfig()
    
    if (!config.apiKey || !config.baseUrl) {
      throw new Error('LLM configuration is missing')
    }

    const chat = new ChatOpenAI({
      openAIApiKey: config.apiKey,
      modelName: config.model,
      temperature: config.temperature,
      configuration: {
        baseURL: config.baseUrl,
      },
      streaming: true,
    })
    
    const memory = getMemory(sessionId)
    let fullResponse = ''

    const encoder = new TextEncoder()
    const streamResponse = new TransformStream()
    const writer = streamResponse.writable.getWriter()

    try {
      const { chat_history } = await memory.loadMemoryVariables({})
      
      // 获取最后一条用户消息
      const lastUserMessage = messages[messages.length - 1].content
      
      // 构建消息数组
      const chatMessages = [
        ...(chat_history || []),
        new HumanMessage(lastUserMessage)
      ]

      chat.stream(chatMessages).then(async (stream) => {
        try {
          for await (const chunk of stream) {
            const content = chunk.content as string
            fullResponse += content
            await writer.write(encoder.encode(content))
          }
          
          await memory.saveContext(
            { input: lastUserMessage },
            { output: fullResponse }
          )

          const wordCount = getWordCount(fullResponse)
          const tokenCount = encode(fullResponse).length
          const completionTime = Date.now() - startTime
          
          const stats = `\n\n---\nStats: ${wordCount} words, ${tokenCount} tokens, model: ${config.model}, time: ${completionTime}ms`
          await writer.write(encoder.encode(stats))
        } finally {
          await writer.close()
        }
      }).catch(async (error) => {
        console.error('Streaming error details:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        await writer.write(encoder.encode(`error: ${errorMessage}`))
        await writer.close()
      })

      return new Response(streamResponse.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })

    } catch (error) {
      throw error
    }

  } catch (error: unknown) {
    console.error('Chat error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '发生未知错误',
    }, { status: 500 })
  }
} 