import { test } from '@japa/runner'

test('should return 422 when the supplied url is not valid', async ({ client }) => {
  const response = await client.post('/api/summarizations').json({
    url: 'invalid-url',
  })

  response.assertStatus(422)
})
