import { connect } from "amqplib";

let connection: any;
let channel: any;

async function initializeRabbitMQ() {
    connection = await connect(`amqp://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@rabbitmq:5672`);
    channel = await connection.createChannel();
}

initializeRabbitMQ().catch(console.error);

export { connection, channel };