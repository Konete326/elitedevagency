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
      <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/inventory/categories')}
            className="flex items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{isEdit ? 'Edit Category' : 'Create Category'}</h1>
            <p className="text-xs text-muted-foreground">{isEdit ? 'Modify category properties' : 'Create a new primary or sub-category classification'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g. Shirts"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-24 resize-none"
                placeholder="e.g. Seasonal apparel and tops"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Parent Category (Optional)</label>
              <select
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/inventory/categories')}
                className="flex-1 inline-flex items-center justify-center rounded-lg border border-border hover:bg-muted font-bold px-4 py-2.5 text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary-accent)] text-white hover:opacity-95 font-bold px-4 py-2.5 text-sm transition-colors cursor-pointer"
              >
                <span>{isEdit ? 'Save Changes' : 'Create Category'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CategoryForm;
