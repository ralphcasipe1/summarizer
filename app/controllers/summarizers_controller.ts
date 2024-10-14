import WebpageCrawler from '#jobs/web_page_crawler'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'
import { createSummarizerValidator } from '#validators/summarizer'
import type { HttpContext } from '@adonisjs/core/http'

export default class SummarizersController {
  public async store({ request, response }: HttpContext) {
    const { url } = await request.validateUsing(createSummarizerValidator)

    const summarizerJob = await SummarizerJob.create({
      url,
      status: SummarizerJobStatus.PENDING,
    })

    await WebpageCrawler.enqueue(url, summarizerJob.id)

    return response.ok({
      id: summarizerJob.id,
      url,
      status: summarizerJob.status,
    })
  }

  public async show({ response, params }: HttpContext) {
    const summarizerJob = await SummarizerJob.find(params.id)

    if (!summarizerJob) {
      return response.notFound({
        message: 'Summary with this `id` is not found.',
      })
    }

    return response.ok({
      id: summarizerJob.id,
      url: summarizerJob.url,
      status: summarizerJob.status,
      summary: summarizerJob.summary,
    })
  }
}
