import { useState, useEffect } from 'react';
import { getDatabase } from '../../../db/database';
import { toast } from 'sonner';
import { Trash2, Edit3, Database, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CategoryList = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let sub;
    getDatabase().then((db) => {
      sub = db.categories
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setCategories(docs);
        });
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

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
        toast.success('Category deleted successfully');
      }
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Category Manager</h1>
            <p className="text-xs text-muted-foreground">Manage your product classifications and hierarchy</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/inventory/categories/new')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-fit">
          <div className="grid grid-cols-12 gap-0 rounded-lg border border-border dark:border-zinc-700 bg-card mb-4 overflow-hidden shadow-xs shrink-0">
            <div className="col-span-12 p-2.5 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs focus:outline-none font-semibold text-foreground dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No categories found matching search.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Image</th>
                    <th className="py-3.5 px-4 font-bold">Name</th>
                    <th className="py-3.5 px-4 font-bold">Parent Category</th>
                    <th className="py-3.5 px-4 font-bold">Description</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm font-semibold">
                  {filteredCategories.map((category) => {
                    const parent = categories.find(p => p._id === category.parentCategoryId);
                    return (
                      <tr key={category._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-4">
                          {category.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-10 w-16 object-cover rounded border border-border"
                            />
                          ) : (
                            <div className="h-10 w-16 bg-muted rounded border border-border flex items-center justify-center">
                              <Database className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 font-bold truncate max-w-[200px]">
                          <span>{category.name}</span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground font-semibold">
                          {parent ? (
                            <span className="inline-flex items-center rounded-full bg-foreground/5 border border-border px-2.5 py-0.5 text-xs font-bold text-foreground">
                              {parent.name}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground/50">None (Primary)</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground truncate max-w-[300px]">
                          {category.description || '-'}
                        </td>
                        <td className="py-4 px-4 text-right flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => navigate(`/inventory/categories/edit/${category._id}`)}
                            className="rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground p-2 transition-colors border border-border cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 p-2 transition-colors border border-red-500/20 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CategoryList;
