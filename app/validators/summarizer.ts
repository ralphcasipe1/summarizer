import vine from '@vinejs/vine'

export const createSummarizerValidator = vine.compile(
  vine.object({
    url: vine.string().url(),
  })
)
