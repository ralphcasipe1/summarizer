import { test } from '@japa/runner'

test('should return 404 when the supplied parameter is not a valid integer', async ({ client }) => {
  const response = await client.get('/api/summarizations/asdf')

  response.assertStatus(404)
})

test('should return a correct response body when the supplied parameter is not a valid integer', async ({
  client,
}) => {
  const response = await client.get('/api/summarizations/asdf')

  response.assertBody({
    message: 'API route not found',
  })
})

test('should return 404 status code when no summarizer job found', async ({ client }) => {
  const id = 1_000
  const response = await client.get(`/api/summarizations/${id}`)

  response.assertStatus(404)
})

test('should return a correct response body when no summarizer job found', async ({ client }) => {
  const id = 1_000
  const response = await client.get(`/api/summarizations/${id}`)

  response.assertBody({
    message: `Summarizer job with ID ${id} could not be found.`,
  })
})
