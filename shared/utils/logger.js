const winston = require('winston');
const path = require('path');

const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, service }) => {
    return `[${timestamp}] [${service}] [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const logger = winston.createLogger({
  defaultMeta: { service: SERVICE_NAME },
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
