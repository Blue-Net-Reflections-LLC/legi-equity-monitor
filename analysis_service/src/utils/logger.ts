import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf } = format;

// Custom format for our logs
const logFormat = printf(({ level, message, timestamp, service }) => {
    return `[${timestamp}] [${service}] [${level.toUpperCase()}] ${message}`;
});

export class Logger {
    private logger;
    
    constructor(service: string) {
        // Ensure logs directory exists
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        this.logger = createLogger({
            format: combine(
                timestamp(),
                logFormat
            ),
            defaultMeta: { service },
            transports: [
                // Console output
                new transports.Console(),
                
                // Write to date-stamped file
                new transports.File({ 
                    filename: path.join(logsDir, `cluster-analysis-${new Date().toISOString().split('T')[0]}.log`),
                    options: { flags: 'a' }
                }),
                
                // Write errors to separate file
                new transports.File({ 
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error',
                    options: { flags: 'a' }
                })
            ]
        });
    }

    info(message: string, ...meta: any[]) {
        this.logger.info(this.formatMessage(message, meta));
    }

    error(message: string, ...meta: any[]) {
        this.logger.error(this.formatMessage(message, meta));
    }

    warn(message: string, ...meta: any[]) {
        this.logger.warn(this.formatMessage(message, meta));
    }

    debug(message: string, ...meta: any[]) {
        this.logger.debug(this.formatMessage(message, meta));
    }

    private formatMessage(message: string, meta: any[]): string {
        if (meta.length === 0) return message;
        
        const metaStr = meta.map(m => {
            if (typeof m === 'string') return m;
            try {
                return JSON.stringify(m, null, 2);
            } catch {
                return String(m);
            }
        }).join(' ');
        
        return `${message} ${metaStr}`;
    }
} 