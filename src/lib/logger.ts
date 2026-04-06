type LogSource = 'MOCK' | 'DB' | 'SYSTEM' | 'ERROR'

class AppLogger {
  private formatMessage(source: LogSource, message: string) {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${source}] ${message}`
  }

  mock(message: string, data?: any) {
    if (data !== undefined) {
      console.log(
        `%c${this.formatMessage('MOCK', message)}`,
        'color: #a855f7; font-weight: bold;',
        data,
      )
    } else {
      console.log(`%c${this.formatMessage('MOCK', message)}`, 'color: #a855f7; font-weight: bold;')
    }
  }

  db(message: string, data?: any) {
    if (data !== undefined) {
      console.log(
        `%c${this.formatMessage('DB', message)}`,
        'color: #22c55e; font-weight: bold;',
        data,
      )
    } else {
      console.log(`%c${this.formatMessage('DB', message)}`, 'color: #22c55e; font-weight: bold;')
    }
  }

  error(message: string, error?: any) {
    if (error !== undefined) {
      console.error(
        `%c${this.formatMessage('ERROR', message)}`,
        'color: #ef4444; font-weight: bold;',
        error,
      )
    } else {
      console.error(
        `%c${this.formatMessage('ERROR', message)}`,
        'color: #ef4444; font-weight: bold;',
      )
    }
  }

  system(message: string, data?: any) {
    if (data !== undefined) {
      console.log(
        `%c${this.formatMessage('SYSTEM', message)}`,
        'color: #3b82f6; font-weight: bold;',
        data,
      )
    } else {
      console.log(
        `%c${this.formatMessage('SYSTEM', message)}`,
        'color: #3b82f6; font-weight: bold;',
      )
    }
  }
}

export const logger = new AppLogger()
