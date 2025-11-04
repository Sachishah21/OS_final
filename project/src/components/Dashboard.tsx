import { useState, useEffect } from 'react';
import { Search, Plus, LogOut, FolderOpen, Eye, EyeOff, Copy, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { encryptData, decryptData } from '../lib/crypto';
import { Category, Password, DecryptedPassword, PasswordType } from '../types';
import PasswordForm from './PasswordForm';
import CategoryManager from './CategoryManager';

export default function Dashboard() {
  const { logout, userId, masterKey } = useAuth();
  const [passwords, setPasswords] = useState<DecryptedPassword[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingPassword, setEditingPassword] = useState<DecryptedPassword | null>(null);
  const [selectedPassword, setSelectedPassword] = useState<DecryptedPassword | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, masterKey]);

  const loadData = async () => {
    if (!userId || !masterKey) return;

    try {
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      setCategories(categoriesData || []);

      const { data: passwordsData } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (passwordsData) {
        const decrypted = await Promise.all(
          passwordsData.map(async (pwd) => {
            try {
              return {
                ...pwd,
                title: await decryptData(pwd.title, masterKey),
                username: await decryptData(pwd.username, masterKey),
                password: await decryptData(pwd.password, masterKey),
                url: pwd.url ? await decryptData(pwd.url, masterKey) : undefined,
                notes: pwd.notes ? await decryptData(pwd.notes, masterKey) : undefined,
                category: categoriesData?.find(c => c.id === pwd.category_id),
              };
            } catch {
              return null;
            }
          })
        );

        setPasswords(decrypted.filter((p): p is DecryptedPassword => p !== null));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (!confirm('Are you sure you want to delete this password?')) return;

    try {
      await supabase.from('passwords').delete().eq('id', id);
      setPasswords(passwords.filter(p => p.id !== id));
      setSelectedPassword(null);
    } catch (error) {
      alert('Failed to delete password');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert('Failed to copy to clipboard');
    }
  };

  const filteredPasswords = passwords.filter(pwd => {
    const matchesSearch = pwd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pwd.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || pwd.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-500 text-xl">Loading your vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/Secure.png" alt="Secure Vault" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-white">
              SECURE <span className="text-orange-500">VAULT</span>
            </h1>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Lock Vault
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 space-y-4">
            <button
              onClick={() => {
                setEditingPassword(null);
                setShowPasswordForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Password
            </button>

            <button
              onClick={() => setShowCategoryManager(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
              Manage Categories
            </button>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === null
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  All Passwords ({passwords.length})
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-cyan-500 text-black font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name} ({passwords.filter(p => p.category_id === category.id).length})
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search passwords..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>

            {filteredPasswords.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
                <p className="text-gray-400">No passwords found</p>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="mt-4 text-cyan-500 hover:text-cyan-400"
                >
                  Add your first password
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPasswords.map(password => (
                  <div
                    key={password.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedPassword(password)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{password.title}</h3>
                          {password.category && (
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: password.category.color + '20',
                                color: password.category.color,
                                borderColor: password.category.color + '40',
                                borderWidth: '1px',
                              }}
                            >
                              {password.category.name}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">{password.username}</p>
                        <p className="text-gray-500 text-xs mt-1">{password.password_type}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(password.username, `username-${password.id}`);
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          title="Copy username"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(password.password, `password-${password.id}`);
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                          title="Copy password"
                        >
                          <Copy className="w-4 h-4 text-cyan-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedPassword && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPassword(null)}>
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedPassword.title}</h2>
              <button onClick={() => setSelectedPassword(null)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Username/Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedPassword.username}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedPassword.username, 'detail-username')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                  >
                    {copiedField === 'detail-username' ? (
                      <span className="text-cyan-500">Copied!</span>
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword === selectedPassword.id ? 'text' : 'password'}
                    value={selectedPassword.password}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={() => setShowPassword(showPassword === selectedPassword.id ? null : selectedPassword.id)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                  >
                    {showPassword === selectedPassword.id ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedPassword.password, 'detail-password')}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                  >
                    {copiedField === 'detail-password' ? (
                      <span className="text-cyan-500">Copied!</span>
                    ) : (
                      <Copy className="w-5 h-5 text-cyan-500" />
                    )}
                  </button>
                </div>
              </div>

              {selectedPassword.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">URL</label>
                  <a
                    href={selectedPassword.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-cyan-500 hover:text-cyan-400"
                  >
                    {selectedPassword.url}
                  </a>
                </div>
              )}

              {selectedPassword.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                  <textarea
                    value={selectedPassword.notes}
                    readOnly
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditingPassword(selectedPassword);
                    setShowPasswordForm(true);
                    setSelectedPassword(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePassword(selectedPassword.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold py-3 rounded-lg transition-colors border border-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordForm && (
        <PasswordForm
          password={editingPassword}
          categories={categories}
          onClose={() => {
            setShowPasswordForm(false);
            setEditingPassword(null);
          }}
          onSave={loadData}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}
