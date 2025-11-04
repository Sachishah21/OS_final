import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  onClose: () => void;
  onUpdate: () => void;
}

const PRESET_COLORS = [
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#10b981',
  '#14b8a6',
];

export default function CategoryManager({ categories, onClose, onUpdate }: CategoryManagerProps) {
  const { userId } = useAuth();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#06b6d4');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newCategoryName.trim()) return;

    setLoading(true);

    try {
      await supabase.from('categories').insert({
        user_id: userId,
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });

      setNewCategoryName('');
      setNewCategoryColor('#06b6d4');
      onUpdate();
    } catch (error) {
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim()) return;

    setLoading(true);

    try {
      await supabase
        .from('categories')
        .update({
          name: editName.trim(),
          color: editColor,
        })
        .eq('id', id);

      setEditingId(null);
      onUpdate();
    } catch (error) {
      alert('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure? Passwords in this category will not be deleted, but will become uncategorized.')) {
      return;
    }

    setLoading(true);

    try {
      await supabase.from('categories').delete().eq('id', id);
      onUpdate();
    } catch (error) {
      alert('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateCategory} className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Create New Category</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-300 mb-2">
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="e.g., Work, Personal, Financial"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className="w-10 h-10 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: newCategoryColor === color ? '#ffffff' : color,
                      transform: newCategoryColor === color ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {newCategoryColor === color && (
                      <Check className="w-6 h-6 mx-auto text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Create Category
            </button>
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-white font-semibold mb-3">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No categories yet</p>
          ) : (
            categories.map(category => (
              <div
                key={category.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                {editingId === category.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className="w-8 h-8 rounded-lg border-2 transition-all"
                          style={{
                            backgroundColor: color,
                            borderColor: editColor === color ? '#ffffff' : color,
                            transform: editColor === color ? 'scale(1.1)' : 'scale(1)',
                          }}
                        >
                          {editColor === color && (
                            <Check className="w-4 h-4 mx-auto text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateCategory(category.id)}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-white font-medium">{category.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(category)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
