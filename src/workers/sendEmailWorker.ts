import { channel } from "../config/rabbitmq";
import { transporter } from "../utils/transporterEmail";

async function sendEmailToUser(payload: { email: string; subject?: string; text?: string }): Promise<void> {
    const mailOptions = {
        from: `${process.env.MAIL_FROM_ADDRESS}`,
        to: payload.email,
        subject: payload.subject || 'Notification',
        text: "This is a plain text message.",
        html: `<b>${payload.text || 'No content provided'}</b>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent:", info.messageId);
    } catch (err) {
        console.error("Error sending email:", err);
        throw err;
    }
}

async function startWorker(): Promise<void> {
    // pastikan queue ada & durable
    await channel.assertQueue('email_queue', { durable: true });

    // optional tapi penting: batasi concurrency
    channel.prefetch(1);

    channel.consume('email_queue', async (msg: any) => {
        if (!msg) return;
        
        console.log('msg: ', JSON.parse(msg.content));
        const data = JSON.parse(msg.content.toString());
        console.log('Received message:', data);

        try {
            if (data.type === 'SEND_EMAIL') {
                await sendEmailToUser(data);
            }

            channel.ack(msg);
        } catch (err) {
            console.error('Email failed:', err);

            // ⚠️ sementara requeue (nanti harus upgrade ke retry system)
            channel.nack(msg, false, true);
        }
    });
}

startWorker();