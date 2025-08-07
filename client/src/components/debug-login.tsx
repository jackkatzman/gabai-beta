import { Button } from "@/components/ui/button";

export function DebugLogin() {
  const testRoutes = async () => {
    const routes = [
      '/api/test-route',
      '/api/auth/google', 
      '/api/auth/user'
    ];

    for (const route of routes) {
      try {
        const response = await fetch(route, { method: 'HEAD' });
        console.log(`${route}: ${response.status}`);
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
    <div className="space-y-4 p-4 border rounded">
      <h3 className="font-semibold">Debug Tools</h3>
      <div className="space-x-2">
        <Button onClick={testRoutes} variant="outline" size="sm">
          Test Routes
        </Button>
        <Button onClick={directLogin} variant="outline" size="sm">
          Direct Login
        </Button>
      </div>
    </div>
  );
}