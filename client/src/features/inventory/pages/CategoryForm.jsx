import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { compressImageToBase64 } from '../../../lib/imageUtils';

export const CategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuthStore();

  const placeholders = {
    name: user?.niche === 'restaurant'
      ? 'e.g. Beverages'
      : user?.niche === 'gym'
        ? 'e.g. Supplements'
        : 'e.g. Shirts',
    desc: user?.niche === 'restaurant'
      ? 'e.g. Cold drinks, juices and hot teas'
      : user?.niche === 'gym'
        ? 'e.g. High protein shakes and dietary products'
        : 'e.g. Seasonal apparel and tops',
  };

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
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCategories(docs);
        });

      if (isEdit) {
        db.categories.findOne(id).exec().then((doc) => {
          if (doc) {
            setName(doc.name || '');
            setDescription(doc.description || '');
            setParentCategoryId(doc.parentCategoryId || '');
            setImage(doc.image || '');
          }
        });
      }
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, [id, isEdit]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Category name is required');
      return;
    }

    try {
      const db = await getDatabase();
      const updatedPayload = {
        name,
        description,
        parentCategoryId: parentCategoryId || '',
        image: image || '',
        isSynced: false,
        updatedAt: new Date().toISOString()
      };

      if (isEdit) {
        const doc = await db.categories.findOne(id).exec();
        if (doc) {
          updatedPayload.imageSynced = image === doc.image ? doc.imageSynced : false;
          await doc.patch(updatedPayload);
          toast.success('Category updated successfully');
        } else {
          toast.error('Category not found');
        }
      } else {
        const categoryId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        const newCategory = {
          _id: categoryId,
          tenantId: user?.tenantId || 'default',
          imageSynced: image ? false : true,
          isDeleted: false,
          ...updatedPayload
        };
        await db.categories.insert(newCategory);
        toast.success('Category created successfully');
      }

      navigate('/inventory/categories');
    } catch {
      toast.error(isEdit ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const parentCategories = categories.filter(c => !c.parentCategoryId && (!isEdit || c._id !== id));

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-4 md:p-5 w-full space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/inventory/categories')}
            className="flex items-center justify-center p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">{isEdit ? 'Edit Category' : 'Create Category'}</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isEdit ? 'Modify category properties' : 'Create a new primary or sub-category classification'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder={placeholders.name}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Parent Category (Optional)</label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="">None (Primary Category)</option>
                  {parentCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Category Banner Image (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1 rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2 py-1 text-[10px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-muted file:text-foreground cursor-pointer"
                    disabled={compressing}
                  />
                  {image && (
                    <div className="relative shrink-0">
                      <img src={image} alt="Preview" className="h-8 w-12 object-cover rounded-md border border-border" />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-700 shadow-sm border border-white"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  )}
                </div>
                {compressing && <p className="text-[9px] text-muted-foreground mt-0.5">Compressing banner...</p>}
                <div className="mt-1 flex items-center">
                  {image ? (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 truncate max-w-full">
                      Active Image: {image.startsWith('http') ? image : 'Local Image File'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-semibold">No category image uploaded</span>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-slate-50 dark:bg-zinc-900/50 px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring h-14 resize-none"
                  placeholder={placeholders.desc}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2.5 border-t border-border dark:border-zinc-700">
              <button
                type="button"
                onClick={() => navigate('/inventory/categories')}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-650 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-250 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={compressing}
                className="px-4 py-2 bg-[var(--primary-accent)] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition-opacity shadow-sm cursor-pointer"
              >
                <span>{compressing ? 'Compressing...' : (isEdit ? 'Save Changes' : 'Create Category')}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CategoryForm;
