import { Button } from "@/components/ui/button";

export function DebugLogin() {
  const testRoutes = async () => {
    const routes = [
      '/api/test-route',
      '/api/auth/google', 
      '/api/auth/user'
    ];

    console.log('🔍 Testing routes from browser...');
    alert('Check the browser console for test results!');
    
    for (const route of routes) {
      try {
        const response = await fetch(route, { 
          method: 'GET',
          redirect: 'manual' // Don't follow redirects so we can see the response
        });
        console.log(`${route}: Status ${response.status}`);
        if (response.status === 302) {
          console.log(`${route}: Redirect to ${response.headers.get('location')}`);
        }
        if (response.status === 200) {
          const text = await response.text();
          console.log(`${route}: Response preview:`, text.substring(0, 100));
        }
      } catch (error) {
        console.error(`${route}: ERROR -`, error);
      }
    }
  };

  const directLogin = () => {
    console.log('🔄 Direct navigation to login...');
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="space-y-2 p-3 border rounded bg-yellow-50 border-yellow-200">
      <h3 className="font-semibold text-sm text-yellow-800">Debug Tools</h3>
      <div className="space-x-2">
        <Button onClick={testRoutes} variant="outline" size="sm" className="bg-white">
          Test Routes
        </Button>
        <Button onClick={directLogin} variant="outline" size="sm" className="bg-white">
          Direct Login
        </Button>
      </div>
      <p className="text-xs text-yellow-700">Use F12 Console to see test results</p>
    </div>
  );
}