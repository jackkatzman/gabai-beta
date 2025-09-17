// Retry wrapper for dynamic imports to handle chunk loading failures
export async function lazyRetry<T>(
  factory: () => Promise<T>, 
  retries = 3, 
  ms = 600
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { 
      return await factory(); 
    } catch (err) {
      console.log(`⚠️ Chunk load attempt ${i + 1}/${retries} failed:`, err);
      
      // If it's a chunk error, try a hard reload on final attempt
      if (i === retries - 1) {
        console.log('❌ Chunk load failed after all retries, reloading page...');
        
        // Optionally: clear caches and reload
        if ('caches' in window) { 
          try { 
            const keys = await caches.keys(); 
            for (const k of keys) await caches.delete(k); 
          } catch {} 
        }
        
        window.location.reload();
        throw new Error("lazyRetry exhausted - reloading page");
      }
      
      await new Promise(r => setTimeout(r, ms));
    }
  }
  
  throw new Error("lazyRetry exhausted");
}