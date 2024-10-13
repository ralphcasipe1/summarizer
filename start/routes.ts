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

router.post('summarizations', async ({ request, response }: HttpContext) => {
  const { url } = request.only(['url'])

  await WebpageCrawler.enqueue(url)

  return response.ok({
    id: 'example',
    url,
    status: 'pending',
  })
})

router.get('summarizations/:id', async ({ response, params }: HttpContext) => {
  return response.ok({
    id: params.id,
    url: 'url',
    status: 'completed',
    summary: 'This is a short summary',
  })
})
