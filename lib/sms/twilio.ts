import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!accountSid || !authToken || !phoneNumber) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: message,
      from: phoneNumber,
      to,
    });

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export async function sendBulkSMS(messages: { to: string; message: string }[]): Promise<number> {
  if (!accountSid || !authToken || !phoneNumber) {
    console.error('Twilio credentials not configured');
    return 0;
  }

  let successCount = 0;

  for (const { to, message } of messages) {
    const success = await sendSMS(to, message);
    if (success) successCount++;
    
    // Rate limiting: wait 100ms between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return successCount;
}

