import { db } from '../database/db';

export interface RiderRecord {
  id: string;
  name: string;
  status: string;
  current_location: string;
}

export class LogisticsService {
  static getRiders(): RiderRecord[] {
    return db.prepare('SELECT * FROM riders').all() as RiderRecord[];
  }

  static assignRiderToOrder(riderId: string, orderId: string) {
    db.prepare('UPDATE riders SET status = "Busy" WHERE id = ?').run(riderId);
    
    const rider = db.prepare('SELECT name FROM riders WHERE id = ?').get(riderId) as { name: string } | undefined;
    if (rider) {
      db.prepare('UPDATE orders SET assigned_rider = ?, status = "Dispatched", updated_at = ? WHERE id = ?')
        .run(rider.name, Date.now(), orderId);
    }
  }

  static completeDelivery(orderId: string) {
    const order = db.prepare('SELECT assigned_rider FROM orders WHERE id = ?').get(orderId) as { assigned_rider: string } | undefined;
    
    db.prepare('UPDATE orders SET status = "Delivered", updated_at = ? WHERE id = ?').run(Date.now(), orderId);
    
    if (order && order.assigned_rider) {
      db.prepare('UPDATE riders SET status = "Idle" WHERE name = ?').run(order.assigned_rider);
    }
  }
}
export default LogisticsService;
