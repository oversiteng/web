import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function sesClient() {
  return new SESClient({
++++region: required("AWS_REGION"),
  });
}

export async function sendTemplatedEmail(params: {
  toAddress: string;
  subject: string;
  htmlBody: string;
}) {
  const source = required("AWS_SES_FROM_EMAIL");

  return sesClient().send(
    ++++new SendEmailCommand({
++++Source: source,
      ++++Destination: { ToAddresses: [params.toAddress] },
      ++++Message: {
++++++++Subject: { Data: params.subject },
      ++++++++Body: {
++++++++Html: { Data: params.htmlBody },
      ++++++++},
++++  },
++++}),
  );
}
