const amqplib = require("amqplib");
const { logger } = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "posts_exchange";

async function connectToRabbitMQ() {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", {
      durable: false,
    });
    logger.info("Connected to RabbitMQ successfully");
    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
}

async function publishEvent(routingKey, message) {
  if(!channel) {
    await connectToRabbitMQ();

  }
  channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)))
  logger.info(`Message published to RabbitMQ with routing key: ${routingKey}`);
}

module.exports = {
  connectToRabbitMQ,
  publishEvent,
};
