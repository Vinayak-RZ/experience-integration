export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  sentAt: string;
  kind: "invite" | "verification" | "password_reset" | "other";
};

/**
 * Dev/test mail capture. Always stores messages in memory.
 * When SMTP_HOST is set, also relays via SMTP (Mailpit locally, SES later).
 */
export type Mailer = {
  send: (msg: Omit<OutboundEmail, "sentAt">) => Promise<void>;
  outbox: () => readonly OutboundEmail[];
  clear: () => void;
};

export function createMailer(opts: {
  smtpHost?: string;
  smtpPort?: number;
  from: string;
}): Mailer {
  const box: OutboundEmail[] = [];

  return {
    async send(msg) {
      const entry: OutboundEmail = {
        ...msg,
        sentAt: new Date().toISOString(),
      };
      box.push(entry);

      if (!opts.smtpHost) return;

      // Minimal SMTP DATA for Mailpit / SES SMTP relay — no nodemailer dep.
      const { createConnection } = await import("node:net");
      await new Promise<void>((resolve, reject) => {
        const socket = createConnection(
          { host: opts.smtpHost, port: opts.smtpPort ?? 1025 },
          () => {
            const payload = [
              `From: ${opts.from}`,
              `To: ${msg.to}`,
              `Subject: ${msg.subject}`,
              "MIME-Version: 1.0",
              'Content-Type: text/plain; charset="utf-8"',
              "",
              msg.text,
              "",
            ].join("\r\n");

            let step = 0;
            const lines = [
              `EHLO stamped-l6\r\n`,
              `MAIL FROM:<${opts.from}>\r\n`,
              `RCPT TO:<${msg.to}>\r\n`,
              `DATA\r\n`,
              `${payload}\r\n.\r\n`,
              `QUIT\r\n`,
            ];

            socket.on("data", () => {
              if (step < lines.length) {
                socket.write(lines[step]);
                step += 1;
              } else {
                socket.end();
                resolve();
              }
            });
            socket.on("error", reject);
          },
        );
        socket.setTimeout(5_000, () => {
          socket.destroy();
          reject(new Error("SMTP timeout"));
        });
      }).catch((err) => {
        // Capture still succeeded; SMTP is best-effort in local/dev.
        console.warn(
          JSON.stringify({
            msg: "smtp_relay_failed",
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      });
    },
    outbox: () => box,
    clear: () => {
      box.length = 0;
    },
  };
}
