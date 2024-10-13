/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
import type { HttpContext } from '@adonisjs/core/http'

import WebPageCrawler from '#jobs/web_page_crawler'
import SummarizerJob, { SummarizerJobStatus } from '#models/summarizer_job'

router.post('summarizations', async ({ request, response }: HttpContext) => {
  const { url } = request.only(['url'])

  const summarizerJob = await SummarizerJob.create({
    url,
    status: SummarizerJobStatus.PENDING,
  })

  await WebPageCrawler.enqueue(url, summarizerJob.id)

  return response.ok({
    id: summarizerJob.id,
    url,
    status: summarizerJob.status,
  })
})

router.get('summarizations/:id', async ({ response, params }: HttpContext) => {
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
})
