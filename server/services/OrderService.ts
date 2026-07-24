import { OrderRepository, OrderRecord } from '../repositories/OrderRepository';
import { InventoryRepository } from '../repositories/InventoryRepository';

export class OrderService {
  static createOrder(
    patientId: string, 
    medicine: string, 
    quantity: number, 
    eceLevel: number, 
    pharmacy?: string,
    eta?: string
  ): OrderRecord {
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newOrder: OrderRecord = {
      id: orderId,
      patient_id: patientId,
      medicine,
      quantity,
      ece_level: eceLevel,
      status: 'Pending',
      assigned_pharmacy: pharmacy || 'Default Pharmacy',
      assigned_rider: 'Unassigned',
      eta: eta || 'N/A',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    OrderRepository.create(newOrder);
    return newOrder;
  }

  static assignRider(orderId: string, riderName: string, eta: string) {
    const order = OrderRepository.getById(orderId);
    if (!order) {
      throw new Error(`Order ID ${orderId} not found.`);
    }

    OrderRepository.updateStatus(orderId, 'Dispatched', riderName, eta);
  }

  static getOrderHistory(): OrderRecord[] {
    return OrderRepository.list();
  }
}
export default OrderService;
