const amqp = require('amqplib');
const logger = require('../utils/logger');

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';

/**
 * Kết nối đến RabbitMQ server
 */
const connect = async () => {
  try {
    if (connection) return channel;
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err.message);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed. Reconnecting...');
      connection = null;
      channel = null;
      setTimeout(connect, 5000);
    });

    logger.info('Connected to RabbitMQ');
    return channel;
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error.message);
    setTimeout(connect, 5000);
    return null;
  }
};

/**
 * Publish message lên exchange
 * @param {string} exchange - Tên exchange
 * @param {string} routingKey - Routing key
 * @param {object} message - Dữ liệu message
 */
const publish = async (exchange, routingKey, message) => {
  try {
    if (!channel) await connect();
    if (!channel) {
      logger.error('Cannot publish message: no RabbitMQ channel');
      return false;
    }

    await channel.assertExchange(exchange, 'topic', { durable: true });

    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    logger.info(`Published message to ${exchange}/${routingKey}`);
    return true;
  } catch (error) {
    logger.error('Failed to publish message:', error.message);
    return false;
  }
};

module.exports = {
  connect,
  publish,
};
