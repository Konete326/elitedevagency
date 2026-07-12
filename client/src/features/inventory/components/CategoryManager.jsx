import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { useAuthStore } from '../../../store/useAuthStore';
import { compressImageToBase64 } from '../../../lib/imageUtils';
import { toast } from 'sonner';
import { Plus, Trash2, FolderPlus, X } from 'lucide-react';

export const CategoryManager = ({ onClose }) => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [image, setImage] = useState('');
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.categories
        .find({
          selector: {
            isDeleted: false
          }
        })
        .$.subscribe((docs) => {
          setCategories(docs);
        });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const base64 = await compressImageToBase64(file);
      setImage(base64);
    } catch {
      toast.error('Failed to compress category image');
    } finally {
      setCompressing(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Category name is required');
      return;
    }

    try {
      const db = await getDatabase();
      const categoryId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

      const newCategory = {
        _id: categoryId,
        tenantId: user?.tenantId || 'default',
        name,
        description,
        parentCategoryId: parentCategoryId || '',
        image: image || '',
        imageSynced: image ? false : true,
        isSynced: false,
        isDeleted: false,
        updatedAt: new Date().toISOString()
      };

      await db.categories.insert(newCategory);
      toast.success('Category created successfully');

      setName('');
      setDescription('');
      setParentCategoryId('');
      setImage('');
    } catch {
      toast.error('Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    try {
      const db = await getDatabase();
      const doc = await db.categories.findOne(id).exec();
      if (doc) {
        await doc.patch({
          isDeleted: true,
          isSynced: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Category deleted');
      }
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const parentCategories = categories.filter(c => !c.parentCategoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-lg flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-accent" />
            <h3 className="font-extrabold text-lg tracking-tight">Category Manager</h3>
          </div>
          <button onClick={onClose} className="rounded-lg border border-border p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">New Category</h4>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Shirts"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-20 resize-none"
                  placeholder="e.g. Seasonal apparel and tops"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Parent Category (Optional)</label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None (Primary Category)</option>
                  {parentCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Category Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-muted file:text-foreground cursor-pointer"
                  disabled={compressing}
                />
                {compressing && <p className="text-[10px] text-muted-foreground mt-1">Compressing banner...</p>}
                {image && (
                  <div className="mt-2 relative inline-block">
                    <img src={image} alt="Preview" className="h-16 w-28 object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-bold px-4 py-2.5 text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </button>
            </form>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6 flex flex-col h-full min-h-0">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Active Categories</h4>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[45vh] md:max-h-none">
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No categories created yet.</p>
              ) : (
                categories.map(c => {
                  const parent = categories.find(p => p._id === c.parentCategoryId);
                  return (
                    <div key={c._id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-foreground/20 transition-all select-none">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.image && (
                          <img src={c.image} alt={c.name} className="h-8 w-12 object-cover rounded border border-border shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{c.name}</p>
                          {parent && (
                            <p className="text-[10px] text-muted-foreground font-semibold">Sub-category of {parent.name}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-1.5 transition-colors border border-red-500/15"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
