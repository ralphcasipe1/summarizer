import { SummarizerJobStatus } from '#models/summarizer_job'
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'summarizer_jobs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('url').index().notNullable()
      table
        .enum('status', Object.values(SummarizerJobStatus))
        .defaultTo(SummarizerJobStatus.PENDING)
      table.text('summary')
      table.text('error')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
