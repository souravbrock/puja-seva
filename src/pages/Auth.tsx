import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Mail, User, KeyRound, Phone, MapPin } from 'lucide-react';
import { requestOtp, verifyOtp } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, Field, Input, Btn } from '../components/ui';

type Step = 'email' | 'otp';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, role, loading, navigate]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    if (phone.trim() !== '' && (phone.replace(/\D/g, '').length < 7)) {
      setError('Enter a valid phone number');
      return;
    }
    setBusy(true);
    try {
      const res = await requestOtp(
        email.trim(),
        name.trim() || undefined,
        phone.trim() || undefined,
        address.trim() || undefined,
      );
      setStep('otp');
      setInfo('We emailed you a 6-digit code. It expires in 10 minutes.');
      if (res.dev_otp) setDevOtp(res.dev_otp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send code');
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(email.trim(), otp.trim());
      await refreshProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-saffron-500 to-maroon-700 flex items-center justify-center mx-auto shadow-lg shadow-maroon-900/20">
          <Flame size={26} className="text-white" />
        </div>
        <h1 className="font-display text-3xl text-maroon-950 mt-3">
          {step === 'email' ? 'Create Account / Sign In' : 'Enter Email Code'}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Customer registration + sign-in in one step. New here? Fill the form
          once — your account is created automatically. No passwords, no Google.
        </p>
      </div>
      <Card className="p-5 sm:p-6">
        {step === 'email' ? (
          <form onSubmit={sendOtp} className="space-y-3.5">
            <Field label="Full name">
              <div className="relative">
                <User
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-10"
                />
              </div>
            </Field>
            <Field label="Phone number">
              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  inputMode="tel"
                  className="pl-10"
                />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="pl-10"
                />
              </div>
            </Field>
            <Field label="Address (optional)">
              <div className="relative">
                <MapPin
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery / puja address"
                  className="pl-10"
                />
              </div>
            </Field>
            {error && (
              <p className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}
            <Btn type="submit" className="w-full" disabled={busy}>
              {busy ? 'Sending...' : 'Send Login Code'}
            </Btn>
          </form>
        ) : (
          <form onSubmit={confirmOtp} className="space-y-3.5">
            <p className="text-sm text-stone-600">
              Code sent to <span className="font-bold text-maroon-900">{email}</span>{' '}
              <button
                type="button"
                className="underline font-semibold"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setInfo('');
                }}
              >
                Change
              </button>
            </p>
            <Field label="6-digit code">
              <div className="relative">
                <KeyRound
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  inputMode="numeric"
                  className="pl-10 tracking-[0.3em] font-bold"
                />
              </div>
            </Field>
            {info && (
              <p className="text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl px-3.5 py-2.5">
                {info}
              </p>
            )}
            {devOtp && (
              <p className="text-xs font-mono text-stone-500 bg-stone-100 rounded-xl px-3.5 py-2.5">
                Dev mode code: {devOtp}
              </p>
            )}
            {error && (
              <p className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}
            <Btn type="submit" className="w-full" disabled={busy}>
              {busy ? 'Verifying...' : 'Verify & Continue'}
            </Btn>
            <button
              type="button"
              disabled={busy}
              onClick={sendOtp}
              className="w-full text-sm font-bold text-saffron-700 hover:underline"
            >
              Resend code
            </button>
          </form>
        )}
        <p className="text-center text-[13px] text-stone-500 mt-4 font-medium">
          Customer registration is this form itself — no separate step.{' '}
          Are you a purohit?{' '}
          <Link to="/purohit/register" className="font-bold text-saffron-700">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}
