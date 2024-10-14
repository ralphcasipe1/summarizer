import openapi from 'openai'
import puppeteer from 'puppeteer'

import { BaseJob } from 'adonis-resque'

import app from '@adonisjs/core/services/app'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'

function splitContentIntoChunks(content: string, maxTokens: number): string[] {
  const chunks: string[] = []
  let currentIndex = 0
  const approximateTokenLength = maxTokens * 4

  while (currentIndex < content.length) {
    const chunk = content.slice(currentIndex, currentIndex + approximateTokenLength)
    chunks.push(chunk)
    currentIndex += approximateTokenLength
  }

  return chunks
}

type OpenAIMessageBody = {
  role:
    | openapi.ChatCompletionSystemMessageParam['role']
    | openapi.ChatCompletionUserMessageParam['role']
  content: string
}

function messagesResolver(messageChunks: string[]): Array<OpenAIMessageBody> {
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

async function fetchContent(url: string) {
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

export default class WebpageCrawler extends BaseJob {
  #model = 'gpt-3.5-turbo'

  async perform(url: string, id: number) {
    const summarizerJob = await SummarizerJob.findOrFail(id)

    try {
      const santizedContent = await fetchContent(url)
      const maxTokens = 500
      const chunkifiedContents = splitContentIntoChunks(santizedContent, maxTokens)
      const messages = messagesResolver(chunkifiedContents)

      const openapiContainer = await app.container.make('openai')

      const chatCompletionResponse = await openapiContainer.chat.completions.create({
        model: this.#model,
        messages,
      })

      const { content } = chatCompletionResponse.choices[0].message
      if (!content) {
        summarizerJob.status = SummarizerJobStatus.FAILED
        await summarizerJob.save()

        return
      }

      summarizerJob.status = SummarizerJobStatus.COMPLETED
      summarizerJob.summary = content.trim()
      await summarizerJob.save()
    } catch (error) {
      summarizerJob.status = SummarizerJobStatus.FAILED
      await summarizerJob.save()
    }
  }
}
