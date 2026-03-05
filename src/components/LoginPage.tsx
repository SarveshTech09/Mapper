import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthProvider';
import '../styles/gradients.css';

const LoginPage = ({ onLoginSuccess }: { onLoginSuccess?: () => void }) => {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ mobile: '', pin: '' });
  const pinRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null)
  ];

  const handlePinChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = v;
    setPin(newPin);
    if (v && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async () => {
    const newErrors = { mobile: '', pin: '' };
    let hasError = false;
    if (!mobile) { newErrors.mobile = 'Mobile number is required'; hasError = true; }
    else if (mobile.length !== 10) { newErrors.mobile = 'Please enter a 10-digit mobile number'; hasError = true; }
    const pinStr = pin.join('');
    if (!pinStr) { newErrors.pin = 'PIN is required'; hasError = true; }
    else if (pinStr.length !== 4) { newErrors.pin = 'PIN must be 4 digits'; hasError = true; }
    if (hasError) { setErrors(newErrors); return; }

    setErrors({ mobile: '', pin: '' });
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password: pinStr, fcm_token: null }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful', data);
        console.log('LoginPage: Token received:', data.access_token.substring(0, 20) + '...');
        // Handle successful login with context
        login(data.access_token, data.user);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        const errorData = await response.json();
        console.error('Login failed', errorData);
        setErrors({ mobile: '', pin: errorData.message || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Network error during login', error);
      setErrors({ mobile: '', pin: 'Network error, please try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        .v5-section{font-family:'Sora',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;overflow:hidden;position:relative}
        .v5-blob-container{position:fixed;inset:0;z-index:0;filter:blur(100px)}
        .v5-blob{position:absolute;border-radius:50%;mix-blend-mode:multiply;opacity:0.7}
        .v5-blob1{width:600px;height:600px;background:#DD6B20;top:-200px;right:-100px;animation:v5morph1 15s ease-in-out infinite}
        .v5-blob2{width:500px;height:500px;background:#6B46C1;bottom:-150px;left:-100px;animation:v5morph2 12s ease-in-out infinite}
        .v5-blob3{width:400px;height:400px;background:#E53E3E;top:50%;left:50%;animation:v5morph3 18s ease-in-out infinite}
        .v5-blob4{width:300px;height:300px;background:#38B2AC;top:20%;left:20%;animation:v5morph1 14s ease-in-out infinite reverse}
        @keyframes v5morph1{0%{transform:translate(0,0) scale(1) rotate(0deg);border-radius:60% 40% 30% 70%/60% 30% 70% 40%}33%{transform:translate(50px,-30px) scale(1.1) rotate(120deg);border-radius:40% 60% 70% 30%/40% 70% 30% 60%}66%{transform:translate(-30px,30px) scale(0.9) rotate(240deg);border-radius:70% 30% 50% 50%/30% 50% 70% 50%}100%{transform:translate(0,0) scale(1) rotate(360deg);border-radius:60% 40% 30% 70%/60% 30% 70% 40%}}
        @keyframes v5morph2{0%{transform:translate(0,0) scale(1);border-radius:40% 60% 70% 30%/40% 70% 30% 60%}50%{transform:translate(60px,-40px) scale(1.15);border-radius:60% 40% 30% 70%/60% 30% 70% 40%}100%{transform:translate(0,0) scale(1);border-radius:40% 60% 70% 30%/40% 70% 30% 60%}}
        @keyframes v5morph3{0%{transform:translate(-50%,-50%) scale(1);border-radius:30% 70% 40% 60%/50% 40% 60% 50%}50%{transform:translate(-40%,-60%) scale(1.2);border-radius:70% 30% 60% 40%/40% 60% 50% 50%}100%{transform:translate(-50%,-50%) scale(1);border-radius:30% 70% 40% 60%/50% 40% 60% 50%}}
        .v5-card{position:relative;z-index:10;width:440px;max-width:92vw;background:rgba(255,255,255,0.75);backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.8);border-radius:32px;padding:52px 44px;animation:v5cardIn 1s cubic-bezier(0.16,1,0.3,1) both;box-shadow:0 30px 60px rgba(0,0,0,0.08),0 0 0 1px rgba(255,255,255,0.5)}
        @keyframes v5cardIn{0%{opacity:0;transform:scale(0.92) translateY(40px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        .v5-brand{text-align:center;margin-bottom:8px}
        .v5-brand h1{font-size:44px;font-weight:800;background:linear-gradient(135deg,#DD6B20 0%,#E53E3E 40%,#6B46C1 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-2px}
        .v5-brand p{color:#888;font-size:15px;font-weight:400;margin-top:4px}
        .v5-steps{display:flex;justify-content:center;gap:8px;margin:28px 0 32px}
        .v5-step{width:40px;height:4px;border-radius:4px;background:#e8e4e0;transition:0.4s}
        .v5-step.active{background:linear-gradient(90deg,#DD6B20,#E53E3E);width:60px}
        .v5-field{margin-bottom:24px;animation:v5fieldIn 0.6s ease both}
        .v5-field:nth-child(1){animation-delay:0.3s}
        .v5-field:nth-child(2){animation-delay:0.45s}
        @keyframes v5fieldIn{0%{opacity:0;transform:translateX(-15px)}100%{opacity:1;transform:translateX(0)}}
        .v5-field label{display:block;color:#555;font-size:13px;font-weight:600;margin-bottom:10px;letter-spacing:0.5px}
        .v5-input{width:100%;padding:16px 20px;background:rgba(255,255,255,0.6);border:2px solid #ece8e3;border-radius:16px;color:#222;font-size:16px;font-family:'Sora',sans-serif;outline:none;transition:all 0.4s}
        .v5-input:focus{border-color:#DD6B20;background:#fff;box-shadow:0 4px 20px rgba(221,107,32,0.1)}
        .v5-input::placeholder{color:#bbb}
        .v5-pin-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .v5-pin-header label{margin-bottom:0}
        .v5-toggle{background:linear-gradient(135deg,rgba(221,107,32,0.08),rgba(107,70,193,0.08));border:none;color:#888;cursor:pointer;font-size:13px;padding:6px 14px;border-radius:20px;transition:0.3s;font-family:'Sora',sans-serif;font-weight:500}
        .v5-toggle:hover{color:#DD6B20;background:rgba(221,107,32,0.12)}
        .v5-pin-boxes{display:flex;gap:14px;justify-content:center}
        .v5-pin-box{width:64px;height:64px;text-align:center;font-size:26px;font-weight:700;background:rgba(255,255,255,0.6);border:2px solid #ece8e3;border-radius:18px;color:#222;outline:none;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);font-family:'Sora',sans-serif}
        .v5-pin-box:focus{border-color:#DD6B20;background:#fff;box-shadow:0 8px 24px rgba(221,107,32,0.1);transform:translateY(-4px)}
        .v5-pin-box.filled{border-color:#6B46C1;background:rgba(107,70,193,0.04)}
        .v5-btn{width:100%;padding:18px;border:none;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;font-family:'Sora',sans-serif;background:linear-gradient(135deg,#DD6B20 0%,#E53E3E 50%,#6B46C1 100%);background-size:200% 200%;color:#fff;transition:all 0.4s;animation:v5fieldIn 0.6s ease 0.6s both,v5gradientMove 4s ease infinite;letter-spacing:0.5px;position:relative;overflow:hidden}
        .v5-btn:hover{transform:translateY(-3px);box-shadow:0 20px 40px rgba(221,107,32,0.25)}
        .v5-btn:active{transform:translateY(-1px)}
        .v5-btn:disabled{opacity:0.7;pointer-events:none}
        .v5-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:24px;animation:v5fieldIn 0.6s ease 0.7s both}
        .v5-bottom a{color:#DD6B20;text-decoration:none;font-size:13px;font-weight:600;transition:0.3s}
        .v5-bottom a:hover{color:#E53E3E}
        .v5-bottom .v5-help{color:#aaa;font-size:12px}
        .v5-error{color:#E53E3E;font-size:12px;margin-top:6px;font-weight:500}
        .v5-spinner{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:v5sp 0.6s linear infinite;vertical-align:middle;margin-right:8px}
        @keyframes v5sp{to{transform:rotate(360deg)}}
        @media(max-width:480px){.v5-card{padding:40px 24px;border-radius:24px}.v5-brand h1{font-size:36px}.v5-pin-box{width:54px;height:54px;font-size:22px;border-radius:14px}}
      `}</style>
      <section className="v5-section">
        <div className="v5-blob-container">
          <div className="v5-blob v5-blob1" />
          <div className="v5-blob v5-blob2" />
          <div className="v5-blob v5-blob3" />
          <div className="v5-blob v5-blob4" />
        </div>
        <div className="v5-card">
          <div className="v5-brand">
            <h1>Waqin</h1>
            <p>Let's get started!</p>
          </div>
          <div className="v5-steps">
            <div className="v5-step active" />
            <div className="v5-step" />
            <div className="v5-step" />
          </div>
          <div className="v5-field">
            <label>Mobile Number</label>
            <input className="v5-input" type="tel" maxLength={10} placeholder="Enter 10-digit number" value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))} />
            {errors.mobile && <div className="v5-error">{errors.mobile}</div>}
          </div>
          <div className="v5-field">
            <div className="v5-pin-header">
              <label>Security PIN</label>
              <button className="v5-toggle" onClick={() => setShowPin(!showPin)}>{showPin ? 'Hide PIN' : 'Show PIN'}</button>
            </div>
            <div className="v5-pin-boxes">
              {pin.map((digit, i) => (
                <input key={i} ref={pinRefs[i]} className={`v5-pin-box${digit ? ' filled' : ''}`}
                  type={showPin ? 'text' : 'password'} maxLength={1} inputMode="numeric" value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)} onKeyDown={(e) => handlePinKeyDown(i, e)} />
              ))}
            </div>
            {errors.pin && <div className="v5-error">{errors.pin}</div>}
          </div>
          <button className="v5-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <><span className="v5-spinner" />Verifying...</> : 'Get Started'}
          </button>
        </div>
      </section>
    </>
  );
};

export default LoginPage;