import { useState } from 'react';
import { Form, Input, Button, Typography, theme } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useAuth } from '../context/AuthProvider';
const { useToken } = theme;
const { Title, Text } = Typography;
const LoginPage = ({ onLoginSuccess }: { onLoginSuccess?: () => void }) => {
  const { token } = useToken();
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    mobile: '',
    password: ''
  });


  const handleLogin = async () => {
    // Reset errors
    setErrors({ mobile: '', password: '' });
    
    // Validation
    let hasError = false;
    const newErrors = { mobile: '', password: '' };
    
    if (!mobile) {
      newErrors.mobile = 'Mobile number is required';
      hasError = true;
    } else if (mobile.length !== 10) {
      newErrors.mobile = 'Please enter a 10-digit mobile number';
      hasError = true;
    }
    
    if (!pin) {
      newErrors.password = 'PIN is required';
      hasError = true;
    } else if (pin.length !== 4) {
      newErrors.password = 'PIN must be 4 digits';
      hasError = true;
    }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    // Login logic here
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, password: pin, "fcm_token": null }),
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
        setErrors({ mobile: '', password: errorData.message || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Network error during login', error);
      setErrors({ mobile: '', password: 'Network error, please try again' });
    } finally {
      setLoading(false);
    }
  };

  // Mock screens object for responsive design
  const screens = {
    md: typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  };

  const styles = {
    footer: {
      marginTop: token.marginLG,
      textAlign: "center" as const,
      width: "100%"
    },
    forgotPassword: {
      float: "right"
    },
    header: {
      marginBottom: token.marginXL,
      textAlign: "center" as const
    },
    panel: {
      backgroundColor: "#ffffff",
      borderRadius: screens.md ? token.borderRadiusLG : "0",
      boxShadow: screens.md ? token.boxShadowTertiary : "none",
      margin: "0 auto",
      padding: screens.md ? `${token.paddingXL}px` : `${token.sizeXXL}px ${token.padding}px`,
      width: "360px"
    },
    section: {
      alignItems: "center",
      backgroundColor: screens.md ? token.colorBgLayout : token.colorBgContainer,
      display: "flex",
      height: screens.md ? "100vh" : "auto",
      padding: screens.md ? `${token.sizeXXL}px 0px` : "0px"
    },
    text: {
      color: token.colorTextSecondary
    },
    title: {
      fontSize: screens.md ? token.fontSizeHeading2 : token.fontSizeHeading3,
      color: "#6B46C1"
    }
  };


  return (
    <section style={styles.section}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <Title style={styles.title}>Waqin</Title>
          <Text style={styles.text}>
            Let's Get Started!
          </Text>
        </div>
        <Form
          name="normal_login"
          initialValues={{
            remember: true,
          }}
          layout="vertical"
        >
          <Form.Item 
            label={<span style={{ fontWeight: "bold" }}>Mobile Number</span>}
            validateStatus={errors.mobile ? "error" : ""}
            help={errors.mobile}
          >
            <Input
              type="number"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10-digit number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </Form.Item>
          
          <Form.Item 
            validateStatus={errors.password ? "error" : ""}
            help={errors.password}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: token.marginSM }}>
              <span style={{ fontWeight: "bold" }}>Enter PIN</span>
              <Button
                type="text"
                icon={showPin ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                onClick={() => setShowPin(!showPin)}
                style={{ color: showPin ? '#718096' : '#718096' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: token.marginXS }}>
              {['', '', '', ''].map((_, i) => (
                <Input
                  key={i}
                  type={showPin ? "text" : "password"}
                  maxLength={1}
                  style={{
                    width: screens.md ? '3rem' : '2.5rem',
                    height: screens.md ? '3rem' : '2.5rem',
                    textAlign: 'center',
                    fontSize: screens.md ? token.fontSizeXL : token.fontSizeLG,
                    borderRadius: token.borderRadius,
                    backgroundColor: token.colorFillAlter,
                  }}
                  value={pin[i] || ''}
                  onChange={(e) => {
                    const newPin = [...pin];
                    newPin[i] = e.target.value;
                    setPin(newPin.join(''));
                    
                    // Move to next input if character entered
                    if (e.target.value && i < 3) {
                      const nextInput = document.getElementById(`pin-input-${i + 1}`);
                      if (nextInput) (nextInput as HTMLInputElement).focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !pin[i] && i > 0) {
                      const prevInput = document.getElementById(`pin-input-${i - 1}`);
                      if (prevInput) (prevInput as HTMLInputElement).focus();
                    }
                  }}
                  id={`pin-input-${i}`}
                />
              ))}
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: "0px" }}>
            <Button
              block
              onClick={handleLogin}
              loading={loading}
              style={{
                backgroundColor: "#DD6B20",
                borderColor: "#DD6B20",
                color: "#ffffff"
              }}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
};

export default LoginPage;