import { useState } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, createAccount, verifyMasterKey } = useAuth();
  const [masterKey, setMasterKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'phone' | 'code'>('phone');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await verifyMasterKey(masterKey);
      if (result.success && result.userId) {
        login(masterKey, result.userId);
      } else {
        setError('Invalid master key');
      }
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (masterKey !== confirmKey) {
      setError('Master keys do not match');
      return;
    }

    if (masterKey.length < 8) {
      setError('Master key must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const userId = await createAccount(masterKey, email || undefined, phoneNumber || undefined);
      login(masterKey, userId);
    } catch (err) {
      setError((err as Error).message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();

    if (recoveryStep === 'phone') {
      if (!recoveryPhone.match(/^\+?[\d\s-()]+$/)) {
        setError('Please enter a valid phone number');
        return;
      }
      setRecoveryStep('code');
      setError('');
    } else {
      if (recoveryCode === 'DEMO2FA') {
        setError('');
        alert('Recovery successful! In production, this would reset your master key.');
        setShowRecovery(false);
        setRecoveryStep('phone');
        setRecoveryPhone('');
        setRecoveryCode('');
      } else {
        setError('Invalid recovery code');
      }
    }
  };

  if (showRecovery) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/Secure.png" alt="Secure Vault" className="w-32 h-32 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Account Recovery</h1>
            <p className="text-gray-400">Reset your master key via 2FA</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-8 shadow-xl border border-gray-800">
            <form onSubmit={handleRecovery} className="space-y-6">
              {recoveryStep === 'phone' ? (
                <>
                  <div>
                    <label htmlFor="recovery-phone" className="block text-sm font-medium text-gray-300 mb-2">
                      Registered Phone Number
                    </label>
                    <input
                      id="recovery-phone"
                      type="tel"
                      value={recoveryPhone}
                      onChange={(e) => setRecoveryPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="+1 234 567 8900"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 text-black py-3 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
                  >
                    Send Recovery Code
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-4 mb-4">
                    <p className="text-cyan-400 text-sm">
                      A recovery code has been sent to {recoveryPhone}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Demo: Use code "DEMO2FA" to proceed
                    </p>
                  </div>

                  <div>
                    <label htmlFor="recovery-code" className="block text-sm font-medium text-gray-300 mb-2">
                      Recovery Code
                    </label>
                    <input
                      id="recovery-code"
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent uppercase tracking-wider"
                      placeholder="Enter code"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 text-black py-3 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
                  >
                    Verify Code
                  </button>
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryStep('phone');
                  setRecoveryPhone('');
                  setRecoveryCode('');
                  setError('');
                }}
                className="w-full text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/Secure.png" alt="Secure Vault" className="w-32 h-32 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">
            SECURE <span className="text-orange-500">VAULT</span>
          </h1>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" />
            The only key you'll ever need
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 shadow-xl border border-gray-800">
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setIsCreating(false)}
              className={`flex-1 py-2 rounded-md transition-colors ${
                !isCreating ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className={`flex-1 py-2 rounded-md transition-colors ${
                isCreating ? 'bg-cyan-500 text-black font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={isCreating ? handleCreateAccount : handleLogin} className="space-y-4">
            {isCreating && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number (For Recovery)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="master-key" className="block text-sm font-medium text-gray-300 mb-2">
                Master Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="master-key"
                  type={showPassword ? 'text' : 'password'}
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter your master key"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isCreating && (
              <div>
                <label htmlFor="confirm-key" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Master Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="confirm-key"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmKey}
                    onChange={(e) => setConfirmKey(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="Confirm your master key"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 text-black py-3 rounded-lg font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isCreating ? 'Create Account' : 'Unlock Vault'}
            </button>

            {!isCreating && (
              <button
                type="button"
                onClick={() => setShowRecovery(true)}
                className="w-full text-cyan-500 hover:text-cyan-400 transition-colors text-sm"
              >
                Forgot Master Key?
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          Your master key is never stored. All data is encrypted locally.
        </p>
      </div>
    </div>
  );
}
