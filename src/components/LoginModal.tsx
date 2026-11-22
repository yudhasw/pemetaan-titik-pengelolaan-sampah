import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (password: string) => Promise<void>;
  errorMessage?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, errorMessage }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError('Silakan masukkan password akses.');
      return;
    }

    setLoading(true);
    setLocalError(null);
    try {
      await onLogin(password);
    } catch (err: any) {
      setLocalError(err?.message || 'Password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a9 9 0 0 0-9 9c0 4.97 9 11 9 11s9-6.03 9-11a9 9 0 0 0-9-9z"></path>
              <circle cx="12" cy="11" r="3"></circle>
            </svg>
          </div>
          <h2>Pemetaan Inisiatif Pengelolaan Sampah</h2>
          <p className="login-subtitle">Kelurahan Tamansari, Kec. Bandung Wetan, Kota Bandung</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="access-password">Password Akses Petugas / Pengelola</label>
            <input
              id="access-password"
              type="password"
              placeholder="Masukkan password akses..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {(localError || errorMessage) && (
            <div className="login-error-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{localError || errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border"></span>
                <span>Memverifikasi...</span>
              </>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Sistem Pemetaan Titik Inisiatif Lokal (Budidaya Maggot, Pengomposan, Bank Sampah, TPS3R) Kelurahan Tamansari.
          </p>
        </div>
      </div>
    </div>
  );
};
