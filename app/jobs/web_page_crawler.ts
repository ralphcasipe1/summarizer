import { BaseJob } from 'adonis-resque'

import env from '#start/env'

import puppeteer from 'puppeteer'
import axios, { AxiosError } from 'axios'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'

function splitContentIntoChunks(content: string, maxTokens: number): string[] {
  const chunks: string[] = []
  let currentIndex = 0
  const approximateTokenLength = maxTokens * 4 // Approximation: 4 characters per token

  while (currentIndex < content.length) {
    const chunk = content.slice(currentIndex, currentIndex + approximateTokenLength)
    chunks.push(chunk)
    currentIndex += approximateTokenLength
  }

  return chunks
}

export default class WebpageCrawler extends BaseJob {
  async perform(url: string, id: number) {
    const summarizerJob = await SummarizerJob.findOrFail(id)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 })

      // Extract main text content, excluding unnecessary elements
      const textContent = await page.evaluate(() => {
        const elementsToRemove = ['script', 'style', 'header', 'footer', '.ads', 'nav']
        elementsToRemove.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove())
        })
        return document.body.innerText
      })

      await browser.close()

      const santizedContent = textContent.replace(/\s+/g, ' ').trim()

      const chunkifiedContents = splitContentIntoChunks(santizedContent, 500)

      const chunkSummaryResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant',
            },
            ...chunkifiedContents.map((chunkifiedContent) => ({
              role: 'user',
              content: `Please summarize this: ${chunkifiedContent}`,
            })),
            {
              role: 'user',
              content: 'Can you please refer to the previous summaries and make it shorter?'
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${env.get('OPENAPI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const summary = chunkSummaryResponse.data.choices[0].message.content.trim()

      summarizerJob.status = SummarizerJobStatus.COMPLETED
      summarizerJob.summary = summary
      await summarizerJob.save()
    } catch (error) {
      summarizerJob.status = SummarizerJobStatus.FAILED
      await summarizerJob.save()

      await browser.close()
    }
  }
}
