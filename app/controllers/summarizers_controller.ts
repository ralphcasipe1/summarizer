import type { HttpContext } from '@adonisjs/core/http'
import redis from '@adonisjs/redis/services/main'
import WebpageCrawler from '#jobs/web_page_crawler'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'
import { createSummarizerValidator } from '#validators/summarizer'

export default class SummarizersController {
  public async store({ request, response, logger }: HttpContext) {
    const { url } = await request.validateUsing(createSummarizerValidator)

    const redisCache = redis.connection('cache')
    const summary = await redisCache.get(url)

    const jobBody = {
      url,
      status: SummarizerJobStatus.PENDING,
    }

    let summarizerJob: SummarizerJob

    if (summary) {
      logger.info({ url }, `Cache of ${url} hit`)

      summarizerJob = await SummarizerJob.create({
        ...jobBody,
        summary,
        status: SummarizerJobStatus.COMPLETED,
      })
    } else {
      logger.info({ url }, `Cache of ${url} not hit`)

      summarizerJob = await SummarizerJob.create(jobBody)

      await WebpageCrawler.enqueue(url, summarizerJob.id)
    }

    return response.ok({
      result: summarizerJob,
    })
  }

  public async show({ response, params, logger }: HttpContext) {
    const summarizerJob = await SummarizerJob.find(params.id)

    if (!summarizerJob) {
      logger.warn({ jobId: params.id }, 'No summarizer job found')

      return response.notFound({
        message: `Summarizer job with ID ${params.id} could not be found.`,
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
