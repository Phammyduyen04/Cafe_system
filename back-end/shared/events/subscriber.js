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

    logger.info('Subscriber connected to RabbitMQ');
    return channel;
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error.message);
    setTimeout(connect, 5000);
    return null;
  }
};

/**
 * Subscribe (consume) message từ exchange
 * @param {string} exchange - Tên exchange
 * @param {string} queue - Tên queue
 * @param {string} routingKey - Routing key pattern
 * @param {function} handler - Callback xử lý message: (message) => {}
 */
const subscribe = async (exchange, queue, routingKey, handler) => {
  try {
    if (!channel) await connect();
    if (!channel) {
      logger.error('Cannot subscribe: no RabbitMQ channel');
      return;
    }

    await channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(q.queue, exchange, routingKey);

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          logger.info(`Received message from ${exchange}/${routingKey}`);
          await handler(content);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error.message);
          channel.nack(msg, false, false);
        }
      }
    });

    logger.info(`Subscribed to ${exchange}/${routingKey} on queue ${queue}`);
  } catch (error) {
    logger.error('Failed to subscribe:', error.message);
  }
};

module.exports = {
  connect,
  subscribe,
};
