import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { Trash2, Edit3, Database, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    let subProd, subCat;
    getDatabase().then((db) => {
      subProd = db.products
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setProducts(docs);
        });

      subCat = db.categories
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCategories(docs);
        });
    });

    return () => {
      if (subProd) subProd.unsubscribe();
      if (subCat) subCat.unsubscribe();
    };
  }, []);

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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || p.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Product Catalog</h1>
            <p className="text-xs text-muted-foreground">Manage your store catalog and product inventory</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inventory/new')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
          <div className="grid grid-cols-12 gap-0 rounded-lg border border-border dark:border-zinc-700 bg-card mb-4 overflow-hidden divide-x divide-border dark:divide-zinc-700 shadow-xs shrink-0">
            <div className="col-span-8 p-2.5 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
              />
            </div>
            <div className="col-span-4 p-2.5 flex flex-col justify-center">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No products found matching filters.</p>
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
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span>{product.sku}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold truncate max-w-[200px]">
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 object-cover rounded-lg border border-border shrink-0"
                            />
                          )}
                          <div>
                            <span>{product.name}</span>
                            {product.variants && product.variants.length > 0 && (
                              <p className="text-[10px] text-muted-foreground font-semibold">
                                {product.variants.length} Variants ({product.variants.map(v => `${v.size}/${v.color}`).join(', ')})
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-accent">Rs. {product.price.toFixed(2)}</td>
                      <td className="py-4 px-4 font-medium">
                        {product.stock <= product.alertLevel ? (
                          <span className="inline-flex items-center rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
                            {product.stock} Alert
                          </span>
                        ) : (
                          <span>{product.stock} Units</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => navigate(`/inventory/edit/${product._id}`)}
                          className="rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground p-2 transition-colors border border-border cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSoftDelete(product._id)}
                          className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-2 transition-colors border border-red-500/20 cursor-pointer"
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
      </main>
    </div>
  );
};

export default ProductList;
