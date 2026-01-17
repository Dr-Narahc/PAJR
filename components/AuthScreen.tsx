import React, { useState } from 'react';
import { Icons } from './Icons';

interface Props {
  onLogin: (role: 'PATIENT' | 'DOCTOR', phoneNumber: string) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.length < 10) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 4) return;
    setLoading(true);
    setTimeout(() => {
      // Simulate Role Logic based on phone number
      // In a real app, this comes from the backend
      const role = phone === '9999999999' ? 'DOCTOR' : 'PATIENT';
      onLogin(role, phone);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
            <Icons.Activity size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome to PAJR</h1>
          <p className="text-gray-500 mt-2 text-sm">Secure Healthcare Intelligence Bridge</p>
        </div>

        {step === 'PHONE' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mobile Number</label>
              <div className="relative">
                <Icons.Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 ml-1">
                Demo: Use <span className="font-mono text-gray-600">9999999999</span> for Doctor, any other for Patient.
              </p>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'Get OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">One Time Password</label>
              <div className="relative">
                <Icons.Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none tracking-widest text-center font-bold"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">
                Sent to <span className="font-semibold">+91 {phone}</span>
                <button onClick={() => setStep('PHONE')} className="ml-2 text-blue-600 hover:underline">Change</button>
              </p>
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 4 || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 flex justify-center items-center gap-2"
            >
               {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'Verify & Login'}
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            By logging in, you agree to the Terms of Service. <br/>
            PAJR is a communication bridge, not an emergency service.
          </p>
        </div>
      </div>
    </div>
  );
};