import { db } from '../database/db';

export interface OrderRecord {
  id: string;
  patient_id: string;
  medicine: string;
  quantity: number;
  ece_level: number;
  status: string;
  assigned_pharmacy?: string;
  assigned_rider?: string;
  eta?: string;
  created_at: number;
  updated_at: number;
  total_amount?: number;
  payment_status?: string;
  payment_method?: string;
  address_line?: string;
  discount?: number;
  delivery_fee?: number;
  tax?: number;
  request_source?: string;
  request_type?: string;
  facility_id?: string;
  blood_group?: string;
  blood_units?: number;
}

export class OrderRepository {
  static create(order: OrderRecord) {
    db.prepare(`
      INSERT INTO orders (
        id, patient_id, medicine, quantity, ece_level, status, 
        assigned_pharmacy, assigned_rider, eta, created_at, updated_at,
        total_amount, payment_status, payment_method, address_line,
        discount, delivery_fee, tax,
        request_source, request_type, facility_id, blood_group, blood_units
      ) VALUES (
        @id, @patient_id, @medicine, @quantity, @ece_level, @status, 
        @assigned_pharmacy, @assigned_rider, @eta, @created_at, @updated_at,
        @total_amount, @payment_status, @payment_method, @address_line,
        @discount, @delivery_fee, @tax,
        @request_source, @request_type, @facility_id, @blood_group, @blood_units
      )
    `).run({
      id: order.id,
      patient_id: order.patient_id || 'HOSP-001',
      medicine: order.medicine,
      quantity: order.quantity,
      ece_level: order.ece_level,
      status: order.status,
      assigned_pharmacy: order.assigned_pharmacy || null,
      assigned_rider: order.assigned_rider || null,
      eta: order.eta || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      total_amount: order.total_amount || 0,
      payment_status: order.payment_status || 'Pending',
      payment_method: order.payment_method || 'N/A',
      address_line: order.address_line || 'Hospital Facility Emergency Routing',
      discount: order.discount || 0,
      delivery_fee: order.delivery_fee || 0,
      tax: order.tax || 0,
      request_source: order.request_source || 'Patient',
      request_type: order.request_type || 'Medicine',
      facility_id: order.facility_id || null,
      blood_group: order.blood_group || null,
      blood_units: order.blood_units || 0
    });
  }

  static getById(id: string): OrderRecord | undefined {
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRecord | undefined;
  }

  static updateStatus(id: string, status: string, rider?: string, eta?: string) {
    if (rider && eta) {
      db.prepare('UPDATE orders SET status = ?, assigned_rider = ?, eta = ?, updated_at = ? WHERE id = ?')
        .run(status, rider, eta, Date.now(), id);
    } else {
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
        .run(status, Date.now(), id);
    }
  }

  static list(limit = 50, offset = 0): OrderRecord[] {
    return db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as OrderRecord[];
  }
}
export default OrderRepository;
