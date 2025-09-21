import * as React from 'react';
import PhoneVerificationPage from '@/pages/phone-verification'; // adjust path if needed

export default function App() {
  React.useEffect(() => console.log('App + PhoneVerification mounted'), []);
  return <PhoneVerificationPage />;
}
