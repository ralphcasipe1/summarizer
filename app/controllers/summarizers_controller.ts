import type { HttpContext } from '@adonisjs/core/http'
import redis from '@adonisjs/redis/services/main'
import WebpageCrawler from '#jobs/web_page_crawler'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'
import { createSummarizerValidator } from '#validators/summarizer'

export default class SummarizersController {
  public async store({ request, response }: HttpContext) {
    const { url } = await request.validateUsing(createSummarizerValidator)

    const redisCache = redis.connection('cache')
    const summary = await redisCache.get(url)

    const jobBody = {
      url,
      status: SummarizerJobStatus.PENDING,
    }

    const summarizerJob = await SummarizerJob.create({
      ...jobBody,
      ...(summary
        ? {
            status: SummarizerJobStatus.COMPLETED,
            summary,
          }
        : {}),
    })

    if (!summary) await WebpageCrawler.enqueue(url, summarizerJob.id)

    return response.ok({
      result: summarizerJob,
    })
  }

  public async show({ response, params }: HttpContext) {
    const summarizerJob = await SummarizerJob.find(params.id)

    if (!summarizerJob) {
      return response.notFound({
        message: 'Summary with this `id` is not found.',
      })
    }

    return response.ok(
      {
        id: summarizerJob.id,
        url: summarizerJob.url,
        status: summarizerJob.status,
        ...(summarizerJob.status === SummarizerJobStatus.COMPLETED
          ? { summary: summarizerJob.summary }
          : {}),
        ...(summarizerJob.status === SummarizerJobStatus.FAILED
          ? { error: summarizerJob.error }
          : {}),
      },
      true
    )
  }
}
