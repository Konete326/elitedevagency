import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Database, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProductManager = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('Supplements');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.products
        .find({
          selector: {
            isDeleted: false
          }
        })
        .$.subscribe((docs) => {
          setProducts(docs);
        });
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !price || !sku || !stock) {
      toast.error('All catalog fields are required');
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }

    try {
      const db = await getDatabase();
      const productId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const fullName = `${name} (${category})`;

      const newProduct = {
        _id: productId,
        tenantId: user?.tenantId || 'default',
        name: fullName,
        price: parsedPrice,
        sku,
        stock: parsedStock,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      await db.products.insert(newProduct);
      toast.success('Product created successfully');

      setName('');
      setPrice('');
      setSku('');
      setStock('0');
    } catch {
      toast.error('Failed to create product');
    }
  };

  const handleSoftDelete = async (id) => {
    try {
      const db = await getDatabase();
      const productDoc = await db.products.findOne(id).exec();
      if (productDoc) {
        await productDoc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Product deleted successfully');
      }
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-colors mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-extrabold text-lg tracking-tight">Inventory Manager</span>
        </div>

        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user?.role}</p>
          <p className="text-sm font-black">{user?.name}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">Create Product</h2>
              <p className="text-sm text-muted-foreground">Add a new item to your local store catalog</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Whey Shake Mix"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. WH-SHK-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Supplements">Supplements</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Membership">Membership</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 19.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-3 text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Catalog Item</span>
              </button>
            </form>
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">Product Catalog</h2>
              <p className="text-sm text-muted-foreground">List of active retail catalog items in local database</p>
            </div>

            <div className="overflow-x-auto w-full">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No products found in database.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">SKU</th>
                      <th className="py-3.5 px-4 font-bold">Name</th>
                      <th className="py-3.5 px-4 font-bold">Price</th>
                      <th className="py-3.5 px-4 font-bold">Stock</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm font-semibold">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{product.sku}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold truncate max-w-[200px]">{product.name}</td>
                        <td className="py-4 px-4 font-extrabold text-accent-niche">${product.price.toFixed(2)}</td>
                        <td className="py-4 px-4 font-medium">
                          {product.stock <= 5 ? (
                            <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                              {product.stock} Low
                            </span>
                          ) : (
                            <span>{product.stock} Units</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleSoftDelete(product._id)}
                            className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-2 transition-colors border border-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ProductManager;
