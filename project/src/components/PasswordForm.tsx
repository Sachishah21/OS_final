import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { encryptData } from '../lib/crypto';
import { Category, DecryptedPassword, PasswordType } from '../types';

interface PasswordFormProps {
  password?: DecryptedPassword | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

const PASSWORD_TYPES: PasswordType[] = [
  'Login Credential',
  'Bank PIN',
  'Software License',
  'API Key',
  'Credit Card',
  'Other',
];

export default function PasswordForm({ password, categories, onClose, onSave }: PasswordFormProps) {
  const { userId, masterKey } = useAuth();
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [passwordType, setPasswordType] = useState<PasswordType>('Login Credential');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (password) {
      setTitle(password.title);
      setUsername(password.username);
      setPasswordValue(password.password);
      setUrl(password.url || '');
      setNotes(password.notes || '');
      setCategoryId(password.category_id || '');
      setPasswordType(password.password_type as PasswordType);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !masterKey) return;

    setLoading(true);

    try {
      const encryptedTitle = await encryptData(title, masterKey);
      const encryptedUsername = await encryptData(username, masterKey);
      const encryptedPassword = await encryptData(passwordValue, masterKey);
      const encryptedUrl = url ? await encryptData(url, masterKey) : null;
      const encryptedNotes = notes ? await encryptData(notes, masterKey) : null;

      const data = {
        user_id: userId,
        title: encryptedTitle,
        username: encryptedUsername,
        password: encryptedPassword,
        url: encryptedUrl,
        notes: encryptedNotes,
        category_id: categoryId || null,
        password_type: passwordType,
        updated_at: new Date().toISOString(),
      };

      if (password) {
        await supabase
          .from('passwords')
          .update(data)
          .eq('id', password.id);
      } else {
        await supabase
          .from('passwords')
          .insert(data);
      }

      onSave();
      onClose();
    } catch (error) {
      alert('Failed to save password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {password ? 'Edit Password' : 'Add New Password'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title / Website Name *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="e.g., Amazon, Gmail, Work Email"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password-type" className="block text-sm font-medium text-gray-300 mb-2">
                Password Type *
              </label>
              <select
                id="password-type"
                value={passwordType}
                onChange={(e) => setPasswordType(e.target.value as PasswordType)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              >
                {PASSWORD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username / Email *
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="username@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : password ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
