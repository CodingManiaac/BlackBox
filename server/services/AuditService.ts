import { db } from '../database/db';

export interface AuditLogRecord {
  id?: number;
  type: string;
  timestamp: number;
  request_id: string;
  agent_id?: string;
  message: string;
  error?: string;
}

export class AuditService {
  static log(record: AuditLogRecord) {
    db.prepare(`
      INSERT INTO audit_logs (type, timestamp, request_id, agent_id, message, error)
      VALUES (@type, @timestamp, @request_id, @agent_id, @message, @error)
    `).run({
      type: record.type,
      timestamp: record.timestamp,
      request_id: record.request_id,
      agent_id: record.agent_id || null,
      message: record.message,
      error: record.error || null
    });
  }

  static getLogs(limit = 100, offset = 0): AuditLogRecord[] {
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset) as AuditLogRecord[];
  }

  static getLogsForRequest(requestId: string): AuditLogRecord[] {
    return db.prepare('SELECT * FROM audit_logs WHERE request_id = ? ORDER BY timestamp ASC').all(requestId) as AuditLogRecord[];
  }
}
export default AuditService;
