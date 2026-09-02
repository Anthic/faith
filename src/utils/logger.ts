import { createLogger, format, transports } from "winston";

// Function to format the log output
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.colorize(),
  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}] ${message} ${stack || ""}`;
  })
);

const loggerTransports: any[] = [
  new transports.Console({
    format: logFormat,
  }),
];

// In Vercel / Serverless, filesystem is read-only. File transports crash with ENOENT mkdir 'logs'.
if (!process.env.VERCEL) {
  try {
    loggerTransports.push(
      new transports.File({ filename: "logs/error.log", level: "error" }),
      new transports.File({ filename: "logs/combined.log" })
    );
  } catch {
    // Ignore filesystem logger errors in read-only environments
  }
}

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || "smvaults-service" },
  transports: loggerTransports,
});

export default logger;
