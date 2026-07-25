import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { useNavigation } from '../../hooks/useNavigation';
import { Search, Heart, ShoppingCart, Plus, Minus, Trash2, Check, CreditCard, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  category: string;
  description: string;
  dosage: string;
  price: number;
  stock: number;
  prescription_required: number;
  image_url: string;
}

interface CartItem {
  id?: string;
  medicine: Medicine;
  quantity: number;
}

interface ShippingAddress {
  id: string;
  patient_id: string;
  name: string;
  address_line: string;
  city: string;
  zip_code: string;
  phone: string;
  is_default: number;
}

export const SearchMedicine: React.FC = () => {
  const toastManager = useToast();
  const { navigateTo } = useNavigation();

  const getPatientId = () => {
    const session = localStorage.getItem('medx_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.associatedId || 'PAT-001';
      } catch (e) {}
    }
    return 'PAT-001';
  };
  
  const patientId = getPatientId();

  // State managers
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dbCategories, setDbCategories] = useState<string[]>(['All']);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  
  // Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  
  // New address form
  const [newName, setNewName] = useState('');
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newZipCode, setNewZipCode] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Payment states
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // AI Intake states
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [tempOrderId, setTempOrderId] = useState('');
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [intakeSymptoms, setIntakeSymptoms] = useState('');
  const [intakeReason, setIntakeReason] = useState('');
  const [intakeEmergency, setIntakeEmergency] = useState('');
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);

  // Fetch medicines and patient address records on mount
  useEffect(() => {
    fetchMedicines();
    fetchAddresses();
    fetchCart();

    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/categories');
        const data = await res.json();
        if (data.success) {
          const names = data.categories.map((c: any) => c.name);
          setDbCategories(['All', ...names]);
        }
      } catch (err) {
        console.error('[Commerce] Fetching categories failed:', err);
      }
    };
    fetchCategories();

    // Load favorites from local storage
    const saved = localStorage.getItem('medx_saved_medicines');
    if (saved) {
      setSavedIds(JSON.parse(saved));
    }
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/medicines');
      const data = await res.json();
      if (data.success) {
        setMedicines(data.medicines);
      }
    } catch (err) {
      console.error('[Commerce] Fetching medicines catalogue failed:', err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/cart?patientId=${patientId}`);
      const data = await res.json();
      if (data.success) {
        const mapped: CartItem[] = data.items.map((i: any) => ({
          id: i.id,
          medicine: {
            id: i.medicine_id,
            name: i.name,
            category: i.category,
            description: i.description,
            dosage: i.dosage,
            price: i.price,
            stock: i.stock,
            prescription_required: i.prescription_required,
            image_url: i.image_url
          },
          quantity: i.quantity
        }));
        setCart(mapped);
      }
    } catch (err) {
      console.error('[Commerce] Fetching cart failed:', err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/addresses?patientId=${patientId}`);
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        const defaultAddr = data.addresses.find((a: ShippingAddress) => a.is_default === 1);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.addresses.length > 0) {
          setSelectedAddressId(data.addresses[0].id);
        }
      }
    } catch (err) {
      console.error('[Commerce] Fetching addresses failed:', err);
    }
  };

  // Toggle favorite saved medicines
  const toggleSaveMedicine = (medicineId: string) => {
    let updated: string[];
    if (savedIds.includes(medicineId)) {
      updated = savedIds.filter(id => id !== medicineId);
      toastManager.addToast('Medicine removed from saved catalogue', 'info');
    } else {
      updated = [...savedIds, medicineId];
      toastManager.addToast('Medicine saved to favorites', 'success');
    }
    setSavedIds(updated);
    localStorage.setItem('medx_saved_medicines', JSON.stringify(updated));
  };

  // Cart operations
  const addToCart = async (med: Medicine) => {
    if (med.stock <= 0) {
      toastManager.addToast('Medicine currently out of stock.', 'warning');
      return;
    }

    const existing = cart.find(item => item.medicine.id === med.id);
    if (existing && existing.quantity >= med.stock) {
      toastManager.addToast('Cannot add more items. Limited stock available.', 'warning');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          medicineId: med.id,
          quantity: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(`Added ${med.name} to cart.`, 'success');
        fetchCart();
      }
    } catch (err) {
      console.error('[Commerce] Add to cart failed:', err);
      toastManager.addToast('Could not add item to cart.', 'error');
    }
  };

  const updateCartQuantity = async (cartItemId: string, currentQty: number, delta: number, maxStock: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    if (newQty > maxStock) {
      toastManager.addToast('Requested quantity exceeds current stock limits.', 'warning');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      const data = await res.json();
      if (data.success) {
        fetchCart();
      }
    } catch (err) {
      console.error('[Commerce] Updating quantity failed:', err);
      toastManager.addToast('Could not update quantity.', 'error');
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    if (!cartItemId) return;
    try {
      const res = await fetch(`http://localhost:3001/api/cart/${cartItemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast('Item removed from cart.', 'info');
        fetchCart();
      }
    } catch (err) {
      console.error('[Commerce] Deleting cart item failed:', err);
      toastManager.addToast('Could not remove item.', 'error');
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAddressLine || !newCity || !newZipCode || !newPhone) {
      toastManager.addToast('Please complete all address fields.', 'warning');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          name: newName,
          addressLine: newAddressLine,
          city: newCity,
          zipCode: newZipCode,
          phone: newPhone,
          isDefault: addresses.length === 0 ? 1 : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast('New delivery address saved.', 'success');
        setIsAddingAddress(false);
        setNewName('');
        setNewAddressLine('');
        setNewCity('');
        setNewZipCode('');
        setNewPhone('');
        fetchAddresses();
      }
    } catch (err) {
      console.error('[Commerce] Saving address failed:', err);
    }
  };

  const handleCheckoutSubmit = () => {
    if (!selectedAddressId) {
      toastManager.addToast('Please add or select a delivery address.', 'warning');
      return;
    }
    // Launch simulated Razorpay modal
    setIsRazorpayOpen(true);
  };

  const handleRazorpaySuccess = async () => {
    setIsProcessingPayment(true);
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    const addressStr = selectedAddress 
      ? `${selectedAddress.address_line}, ${selectedAddress.city} - ${selectedAddress.zip_code} (Phone: ${selectedAddress.phone})`
      : 'Default Delivery Address';

    try {
      const res = await fetch('http://localhost:3001/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId,
          items: cart.map(item => ({
            name: item.medicine.name,
            price: item.medicine.price,
            quantity: item.quantity
          })),
          totalAmount: Number(cartTotal.toFixed(2)),
          paymentMethod: 'Razorpay UPI/Card',
          addressLine: addressStr,
          discount: Number(cartDiscount.toFixed(2)),
          deliveryFee: Number(cartDeliveryFee.toFixed(2)),
          tax: Number(cartTax.toFixed(2))
        })
      });

      const data = await res.json();
      setIsProcessingPayment(false);

      if (data.success) {
        toastManager.addToast('Payment Successful! Authorizing clinical diagnostic check...', 'success');
        setTempOrderId(data.orderId);
        setIsRazorpayOpen(false);
        setIsIntakeOpen(true);
      } else {
        toastManager.addToast(data.message || 'Checkout failed.', 'error');
      }
    } catch (err) {
      setIsProcessingPayment(false);
      console.error('[Commerce] Order submission failed:', err);
      toastManager.addToast('Checkout processing failed.', 'error');
    }
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeSymptoms || !intakeReason || !intakeEmergency) {
      toastManager.addToast('Please complete all clinical diagnostic fields, including the emergency description.', 'warning');
      return;
    }

    setIsSubmittingIntake(true);
    const query = `Symptom: ${intakeSymptoms}. Reason: ${intakeReason}. Emergency Details: ${intakeEmergency}`;
    
    try {
      const res = await fetch('http://localhost:3001/api/orders/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: tempOrderId,
          patientId: patientId,
          query
        })
      });

      const data = await res.json();
      setIsSubmittingIntake(false);

      if (data.success) {
        toastManager.addToast('Clinical diagnosis analysis complete. Order dispatched.', 'success');
        setCart([]); // Clear cart
        setIsIntakeOpen(false);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        
        // Reset intake forms
        setIntakeSymptoms('');
        setIntakeReason('');
        setIntakeEmergency('');
        
        // Redirect to order history
        navigateTo('/patient/orders');
      } else {
        toastManager.addToast(data.message || 'Intake submission failed.', 'error');
      }
    } catch (err) {
      setIsSubmittingIntake(false);
      console.error('[Intake] AI diagnostic submission failed:', err);
      toastManager.addToast('Clinical submission failed. Routing via standard checkout.', 'warning');
      
      // Fallback: Clear cart and redirect anyway so order is not lost
      setCart([]);
      setIsIntakeOpen(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      navigateTo('/patient/orders');
    }
  };

  // Filter medicines
  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          med.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || med.category === selectedCategory;
    const matchesSaved = !viewSavedOnly || savedIds.includes(med.id);
    return matchesSearch && matchesCategory && matchesSaved;
  });

  const categories = dbCategories;

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.medicine.price * item.quantity), 0);
  const cartDiscount = cartSubtotal * (discountPercent / 100);
  const cartDeliveryFee = cartSubtotal > 30 || cartSubtotal === 0 ? 0 : 5;
  const cartTax = (cartSubtotal - cartDiscount) * 0.12; // 12% GST
  const cartTotal = (cartSubtotal - cartDiscount) + cartDeliveryFee + cartTax;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="MedX Pharmacy Catalogue" 
          description="Purchase clinical medications directly. Secured by persistent checkout verification."
        />
        <Button 
          variant="secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}
          onClick={() => setIsCartOpen(true)}
        >
          <ShoppingCart size={18} />
          View Cart
          {cart.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: 'var(--color-danger)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '50%'
            }}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Tabs / Filters Panel */}
      <Card shadow="sm">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search medicine brand or generic..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Toggle Catalogue vs Saved */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant={!viewSavedOnly ? 'primary' : 'secondary'}
              onClick={() => setViewSavedOnly(false)}
              style={{ fontSize: '13px' }}
            >
              Shop Catalogue
            </Button>
            <Button 
              variant={viewSavedOnly ? 'primary' : 'secondary'}
              onClick={() => setViewSavedOnly(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Heart size={14} fill={viewSavedOnly ? 'white' : 'none'} />
              Saved ({savedIds.length})
            </Button>
          </div>
        </div>

        {/* Category chips filter */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid var(--color-border)',
                backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                color: selectedCategory === cat ? 'white' : 'var(--color-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Catalogue Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        {filteredMedicines.map(med => (
          <Card key={med.id} shadow="sm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'space-between' }}>
              <div>
                {/* Image section */}
                <div style={{
                  height: '140px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  marginBottom: '12px'
                }}>
                  <img 
                    src={med.image_url} 
                    alt={med.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  
                  {/* Category badge */}
                  <Badge 
                    variant="info" 
                    style={{ position: 'absolute', top: '8px', left: '8px', textTransform: 'uppercase', fontSize: '9px' }}
                  >
                    {med.category}
                  </Badge>

                  {/* Favorite heart button */}
                  <button
                    onClick={() => toggleSaveMedicine(med.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Heart size={16} color="red" fill={savedIds.includes(med.id) ? 'red' : 'none'} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{med.name}</h4>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    ${med.price.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0' }}>
                  <span className="medx-caption" style={{ fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                    Dosage: {med.dosage}
                  </span>
                  <span className="medx-caption" style={{ fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                    Stock: {med.stock} units
                  </span>
                </div>

                <p className="medx-caption" style={{ fontSize: '12px', lineHeight: 1.4, margin: '8px 0 12px' }}>
                  {med.description}
                </p>
              </div>

              <div>
                {/* Prescription Check Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  {med.prescription_required === 1 ? (
                    <Badge variant="danger" style={{ fontSize: '10px', width: '100%', textAlign: 'center' }}>
                      📋 Prescription Required
                    </Badge>
                  ) : (
                    <Badge variant="success" style={{ fontSize: '10px', width: '100%', textAlign: 'center' }}>
                      🟢 Over-the-Counter
                    </Badge>
                  )}
                </div>

                <Button 
                  variant="primary" 
                  style={{ width: '100%' }}
                  disabled={med.stock <= 0}
                  onClick={() => addToCart(med)}
                >
                  {med.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {filteredMedicines.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 16px' }}>
            <span style={{ fontSize: '40px' }}>🔍</span>
            <h4 style={{ margin: '16px 0 8px' }}>No Medicines Found</h4>
            <p className="medx-caption" style={{ maxWidth: '320px', margin: '0 auto' }}>
              Adjust search text query filters or category selections to explore alternatives.
            </p>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          height: '100vh',
          backgroundColor: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease'
        }}>
          {/* Drawer Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} />
              Shopping Cart
            </h3>
            <button 
              onClick={() => setIsCartOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--color-text-secondary)' }}
            >
              ✕
            </button>
          </div>

          {/* Drawer Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.map(item => (
              <div key={item.medicine.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <img 
                  src={item.medicine.image_url} 
                  alt={item.medicine.name}
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>{item.medicine.name}</h4>
                  <span className="medx-caption" style={{ fontSize: '12px' }}>
                    ${item.medicine.price.toFixed(2)} each
                  </span>
                  
                  {/* Quantity adjusts */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <button 
                      onClick={() => updateCartQuantity(item.id || '', item.quantity, -1, item.medicine.stock)}
                      style={{ padding: '2px 6px', border: '1px solid var(--color-border)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Minus size={10} />
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.id || '', item.quantity, 1, item.medicine.stock)}
                      style={{ padding: '2px 6px', border: '1px solid var(--color-border)', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.id || '')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '48px', color: 'var(--color-text-secondary)' }}>
                Your cart is empty.
              </div>
            )}
          </div>

          {/* Drawer Footer Checkout Summary */}
          {cart.length > 0 && (
            <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(0,0,0,0.01)' }}>
              
              {/* Coupon input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Coupon Code (HEALTHY10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '12px', background: 'transparent', color: 'var(--color-text-primary)' }}
                />
                <Button
                  variant="secondary"
                  style={{ height: '32px', fontSize: '11px', padding: '0 12px' }}
                  onClick={() => {
                    if (couponCode.toUpperCase() === 'HEALTHY10') {
                      setDiscountPercent(10);
                      toastManager.addToast('Promo Applied: 10% Discount!', 'success');
                    } else {
                      toastManager.addToast('Invalid Promo Coupon.', 'error');
                    }
                  }}
                >
                  Apply
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              
              {cartDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-danger)' }}>
                  <span>Discount (10% OFF)</span>
                  <span>-${cartDiscount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Delivery Charges</span>
                <span>{cartDeliveryFee > 0 ? `$${cartDeliveryFee.toFixed(2)}` : 'FREE'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>GST (12% Fused)</span>
                <span>${cartTax.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <span>Grand Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <Button 
                variant="primary" 
                style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                onClick={() => setIsCheckoutOpen(true)}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Checkout Wizard Modal */}
      {isCheckoutOpen && (
        <Modal 
          isOpen={isCheckoutOpen} 
          onClose={() => setIsCheckoutOpen(false)}
          title="🚚 Secure Shipping Details & Checkout"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Step 1: Select Shipping address */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Select Shipping Address</h4>
                {!isAddingAddress && (
                  <Button variant="secondary" onClick={() => setIsAddingAddress(true)} style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}>
                    + Add Address
                  </Button>
                )}
              </div>

              {isAddingAddress ? (
                /* Address Add Form */
                <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Recipient Full Name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Address Line (Street, Flat #)"
                    value={newAddressLine}
                    onChange={e => setNewAddressLine(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="City"
                      value={newCity}
                      onChange={e => setNewCity(e.target.value)}
                      style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <input 
                      type="text" 
                      placeholder="Zip Code"
                      value={newZipCode}
                      onChange={e => setNewZipCode(e.target.value)}
                      style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Contact Phone Number"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => setIsAddingAddress(false)} style={{ height: '28px', fontSize: '11px' }}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" style={{ height: '28px', fontSize: '11px' }}>
                      Save Address
                    </Button>
                  </div>
                </form>
              ) : (
                /* Select addresses list */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {addresses.map(a => (
                    <div 
                      key={a.id}
                      onClick={() => setSelectedAddressId(a.id)}
                      style={{
                        padding: '12px',
                        border: selectedAddressId === a.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: '8px',
                        backgroundColor: selectedAddressId === a.id ? 'rgba(37,99,235,0.02)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <MapPin size={16} style={{ color: selectedAddressId === a.id ? 'var(--color-primary)' : 'var(--color-text-secondary)', marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{a.name}</span>
                          {a.is_default === 1 && <Badge variant="success" style={{ fontSize: '8px', padding: '1px 4px' }}>Default</Badge>}
                        </div>
                        <p className="medx-caption" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                          {a.address_line}, {a.city} - {a.zip_code} (Tel: {a.phone})
                        </p>
                      </div>
                      {selectedAddressId === a.id && <Check size={16} style={{ color: 'var(--color-primary)', alignSelf: 'center' }} />}
                    </div>
                  ))}

                  {addresses.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-secondary)', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                      No shipping address saved. Click "+ Add Address" to configure.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Payment options */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Secure Payment Mode</h4>
              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'rgba(0,0,0,0.01)',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(37,99,235,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <CreditCard size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Razorpay Secure Checkout</div>
                  <div className="medx-caption" style={{ fontSize: '11px' }}>Support UPI, Netbanking, Cards. (Test Mode)</div>
                </div>
                <Badge variant="info">Enabled</Badge>
              </div>
            </div>

            {/* Total checkout summary */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="medx-caption" style={{ fontSize: '12px' }}>Total billing amount</span>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  ${cartTotal.toFixed(2)}
                </div>
              </div>

              <Button 
                variant="primary" 
                onClick={handleCheckoutSubmit}
                style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Pay with Razorpay
                <ArrowRight size={16} />
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Razorpay Test Mode Overlay Dialog */}
      {isRazorpayOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            width: '380px',
            backgroundColor: '#0F172A', // Premium dark slate styling matching Razorpay checkout style
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Razorpay header */}
            <div style={{
              padding: '24px 20px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#3B82F6', letterSpacing: '0.5px' }}>Razorpay</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '2px 6px', borderRadius: '4px' }}>TEST MODE</span>
                </div>
                <div className="medx-caption" style={{ color: '#94A3B8', fontSize: '11px', marginTop: '4px' }}>
                  MedX Unified Retail Platform
                </div>
              </div>
              <button 
                onClick={() => setIsRazorpayOpen(false)}
                disabled={isProcessingPayment}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            {/* Order summary billing */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>Amount to Pay:</span>
              <span style={{ color: 'white', fontSize: '18px', fontWeight: 700 }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Simulated options list */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <AlertCircle size={14} />
                Test Gateway Simulator
              </div>
              
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                This is a sandbox commerce pipeline simulation. Press the button below to authorize a successful checkout transaction.
              </p>

              <Button
                variant="primary"
                onClick={handleRazorpaySuccess}
                disabled={isProcessingPayment}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)'
                }}
              >
                {isProcessingPayment ? (
                  'Authorizing Payment...'
                ) : (
                  <>
                    <Check size={16} />
                    Confirm Payment (Success)
                  </>
                )}
              </Button>

              <button
                onClick={() => {
                  toastManager.addToast('Payment cancelled by customer', 'info');
                  setIsRazorpayOpen(false);
                }}
                disabled={isProcessingPayment}
                style={{
                  width: '100%',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '10px',
                  color: '#94A3B8',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel / Decline Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Clinical Intake Questionnaire Modal */}
      {isIntakeOpen && (
        <Modal
          isOpen={isIntakeOpen}
          onClose={() => {
            toastManager.addToast('Please complete clinical check or skip to proceed.', 'warning');
          }}
          title="📋 Why do you need this medicine? (MedX AI Diagnostic Check)"
        >
          <form onSubmit={handleIntakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
              MedX AI analyzes your intake symptoms in real-time to check for clinical risks, establish priority ECE levels, and optimize routing coordinates.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                State Your Symptoms (Required)
              </label>
              <textarea
                value={intakeSymptoms}
                onChange={e => setIntakeSymptoms(e.target.value)}
                placeholder="Describe current physical symptoms (e.g., chest tightness, mild fever, breathing issues...)"
                rows={3}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Primary Medical Reason / Context (Required)
              </label>
              <textarea
                value={intakeReason}
                onChange={e => setIntakeReason(e.target.value)}
                placeholder="Specify the reason for medication (e.g., routine cholesterol refill, sudden headache, doctor advised...)"
                rows={2}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Emergency Description / Details (Required)
              </label>
              <textarea
                value={intakeEmergency}
                onChange={e => setIntakeEmergency(e.target.value)}
                placeholder="Enter details if this requires urgent or same-day dispatch..."
                rows={2}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmittingIntake}
                onClick={() => {
                  toastManager.addToast('Diagnostics bypassed. Order queued for retail dispatch.', 'info');
                  setCart([]);
                  setIsIntakeOpen(false);
                  setIsCheckoutOpen(false);
                  setIsCartOpen(false);
                  navigateTo('/patient/orders');
                }}
              >
                Skip Check
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingIntake}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isSubmittingIntake ? 'Running AI Engine...' : 'Run Diagnostics & Dispatch'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Styled slideIn animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />

    </div>
  );
};

export default SearchMedicine;
