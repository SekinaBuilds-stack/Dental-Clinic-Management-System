import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import type { RetailProduct } from '../../types/retail';
import { RetailReturnModal } from './RetailReturnModal';

interface CartItem {
  product: RetailProduct;
  quantity: number;
}

export function RetailPOSView() {
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/retail-sales/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to load retail products', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: RetailProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === productId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean) as CartItem[]);
  };

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.product.retailPrice) * item.quantity), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/v1/retail-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(i => ({ retailProductId: i.product.id, quantity: i.quantity })),
          paymentMethod
        })
      });
      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      setSuccessMsg(`Sale completed successfully! Receipt: ${data.receiptNumber}`);
      setCart([]);
      fetchProducts(); // Refresh stock counts
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.inventoryItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Bar with Return Modal Trigger */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Retail POS Terminal</h1>
          <p className="text-xs text-gray-500">Process over-the-counter retail sales and inventory deductions</p>
        </div>
        <button 
          onClick={() => setShowReturnModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-2xl font-bold text-xs transition border border-amber-200"
        >
          <RotateCcw size={16} /> Process Sales Return
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Catalog */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Product Catalog</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search SKU or product..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredProducts.map(prod => (
              <div 
                key={prod.id} 
                onClick={() => addToCart(prod)}
                className="p-4 border rounded-2xl hover:border-emerald-500 cursor-pointer transition flex flex-col justify-between space-y-2 bg-gray-50/50"
              >
                <div>
                  <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-md font-mono">{prod.sku}</span>
                  <h4 className="font-bold text-xs text-gray-800 mt-1">{prod.inventoryItem.name}</h4>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 font-extrabold text-xs">${Number(prod.retailPrice).toFixed(2)}</span>
                  <span className={`text-[10px] font-bold ${prod.inventoryItem.currentStock > 5 ? 'text-green-600' : 'text-red-500'}`}>
                    Stock: {prod.inventoryItem.currentStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* POS Cart & Checkout */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                <ShoppingCart size={16} /> Active Cart
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-xl">
                {cart.reduce((a, c) => a + c.quantity, 0)} items
              </span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">Cart is empty. Click products to add.</p>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                    <div>
                      <h5 className="font-bold text-xs text-gray-800">{item.product.inventoryItem.name}</h5>
                      <p className="text-[10px] text-gray-500">${Number(item.product.retailPrice).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 bg-white border rounded-lg"><Minus size={12} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 bg-white border rounded-lg"><Plus size={12} /></button>
                      <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-500"><span>VAT (15%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-2 border-t"><span>Total Due</span><span>${total.toFixed(2)}</span></div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs font-semibold bg-gray-50 outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}

            <button 
              disabled={cart.length === 0 || loading}
              onClick={handleCheckout}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition text-xs"
            >
              {loading ? 'Processing Checkout...' : `Complete Checkout ($${total.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Return Modal */}
      <RetailReturnModal 
        isOpen={showReturnModal} 
        onClose={() => setShowReturnModal(false)} 
        onSuccess={fetchProducts} 
      />
    </div>
  );
}