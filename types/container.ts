import OpenAI from 'openai'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    openai: OpenAI
  }
}
