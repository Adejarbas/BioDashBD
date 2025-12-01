// lib/logger-winston.js
const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

// Configuração do Logtail (BetterStack)
const logtail = new Logtail(process.env.LOGTAIL_TOKEN, {
  endpoint: process.env.LOGTAIL_URL,
});

// Criando a instância base com formatação
const baseLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp, ...rest }) => {
      const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${meta}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Log no console também
    new LogtailTransport(logtail),
  ],
});

// Métodos personalizados
const logger = {
  info: (msg, meta) => baseLogger.info(msg, meta),
  warn: (msg, meta) => baseLogger.warn(msg, meta),
  error: (msg, meta) => baseLogger.error(msg, meta),
  debug: (msg, meta) => baseLogger.debug(msg, meta),
};

module.exports = logger;
