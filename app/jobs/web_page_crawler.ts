import openapi from 'openai'
import puppeteer from 'puppeteer'

import { BaseJob } from 'adonis-resque'

import app from '@adonisjs/core/services/app'
import redis from '@adonisjs/redis/services/main'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'

type OpenAIMessageBody = {
  role:
    | openapi.ChatCompletionSystemMessageParam['role']
    | openapi.ChatCompletionUserMessageParam['role']
  content: string
}

export default class WebpageCrawler extends BaseJob {
  #maxTokens = 500
  #redisCache = redis.connection('cache')

  async perform(url: string, jobId: number) {
    const summarizerJob = await SummarizerJob.find(jobId)

    if (!summarizerJob) {
      throw new Error('Failed')
    }

    try {
      const santizedContent = await this.fetchContent(url)
      const chunkifiedContents = this.splitContentIntoChunks(santizedContent)
      const messages = this.messagesResolver(chunkifiedContents)

      const openapiContainer = await app.container.make('openai')

      const chatCompletionResponse = await openapiContainer.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
      })

      const { content } = chatCompletionResponse.choices[0].message
      if (!content) {
        summarizerJob.status = SummarizerJobStatus.FAILED
        summarizerJob.error = 'Empty content found'
        await summarizerJob.save()

        return
      }

      const summary = content.trim()
      summarizerJob.status = SummarizerJobStatus.COMPLETED
      summarizerJob.summary = summary
      await summarizerJob.save()
      await this.#redisCache.set(url, summary)
    } catch (error) {
      summarizerJob.status = SummarizerJobStatus.FAILED
      summarizerJob.error = 'Failed to summarize the content'
      await summarizerJob.save()
    }
  }

  private async fetchContent(url: string) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 })

      // Extract main text content, excluding unnecessary elements
      const textContent = await page.evaluate(() => {
        const elementsToRemove = ['script', 'style', 'header', 'footer', '.ads', 'nav']

        elementsToRemove.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => el.remove())
        })

        return document.body.innerText
      })

      await browser.close()

      const santizedContent = textContent.replace(/\s+/g, ' ').trim()

      return santizedContent
    } catch (error) {
      await browser.close()
      throw new Error('Unable to fetch and process the content.')
    }
  }

  private splitContentIntoChunks(content: string): string[] {
    const chunks: string[] = []
    let currentIndex = 0
    const approximateTokenLength = this.#maxTokens * 4

    while (currentIndex < content.length) {
      const chunk = content.slice(currentIndex, currentIndex + approximateTokenLength)
      chunks.push(chunk)
      currentIndex += approximateTokenLength
    }

    return chunks
  }

  private messagesResolver(messageChunks: string[]): Array<OpenAIMessageBody> {
    return [
      {
        role: 'system',
        content: 'You are a helpful assistant',
      },
      ...messageChunks.map<OpenAIMessageBody>((messageChunk) => ({
        role: 'user',
        content: messageChunk,
      })),
      {
        role: 'user',
        content: 'Can you please refer to the previous summaries and make it shorter?',
      },
    ]
  }
}
