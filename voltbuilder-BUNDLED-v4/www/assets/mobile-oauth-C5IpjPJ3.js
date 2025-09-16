async function p(){var t,o;if(console.log("📱 Setting up mobile OAuth handler"),typeof window<"u"&&window.Capacitor){console.log("📱 Mobile environment detected - setting up deep link handler");try{if((o=(t=window.Capacitor)==null?void 0:t.Plugins)!=null&&o.App)window.Capacitor.Plugins.App.addListener("appUrlOpen",e=>{console.log("🔗 Deep link received:",e.url),c(e.url)}),console.log("✅ Capacitor App listener registered");else throw new Error("Capacitor App not available")}catch{console.log("⚠️ Capacitor App not available, using fallback handler"),window.handleAuthCallback=e=>{console.log("🔗 Auth callback received:",e),c(e)}}}else console.log("🌐 Web environment - mobile auth not needed")}function c(t){try{const o=new URL(t);if(console.log("🔍 Processing deep link:",{protocol:o.protocol,host:o.hostname,path:o.pathname}),o.protocol==="gabai:"&&o.hostname==="auth"){const n=o.searchParams.get("token"),e=o.searchParams.get("code");n?(console.log("✅ Mobile auth token received"),d(n)):e?(console.log("✅ Mobile auth code received"),console.log("⚠️ Code-based auth not implemented, use token flow")):console.log("⚠️ No token or code in deep link")}else console.log("❌ Deep link not for auth:",t)}catch(o){console.error("❌ Error processing deep link:",o)}}async function h(){console.log("🔐 Starting VoltBuilder iframe-based OAuth flow");const t="https://gabai.ai",n=`${t}/api/auth/google?state=${encodeURIComponent("voltbuilder-iframe")}&mobile=true&embed=true`;console.log("🔗 Creating OAuth iframe:",n);try{const e=document.createElement("iframe");e.src=n,e.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      height: 80vh;
      max-width: 400px;
      max-height: 600px;
      border: none;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 10000;
      background: white;
    `;const r=document.createElement("div");r.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `,document.body.appendChild(r),document.body.appendChild(e),console.log("✅ OAuth iframe created");const a=l=>{var s;l.origin===t&&(l.data==="auth_success"||((s=l.data)==null?void 0:s.type)==="auth_success")&&(console.log("✅ Auth success message received from iframe"),document.body.removeChild(e),document.body.removeChild(r),window.removeEventListener("message",a),setTimeout(()=>{window.location.reload()},500))};window.addEventListener("message",a);const i=document.createElement("button");i.textContent="✕",i.style.cssText=`
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      font-size: 16px;
      cursor: pointer;
      z-index: 10001;
    `,i.onclick=()=>{document.body.removeChild(e),document.body.removeChild(r),window.removeEventListener("message",a),console.log("❌ OAuth iframe closed by user")},document.body.appendChild(i),setTimeout(()=>{document.body.contains(e)&&(document.body.removeChild(e),document.body.removeChild(r),document.body.contains(i)&&document.body.removeChild(i),window.removeEventListener("message",a),console.log("⏰ OAuth iframe timeout"))},3e5)}catch(e){console.error("❌ Error creating OAuth iframe:",e),window.location.href=n}}async function d(t){try{console.log("🎫 Completing auth with token"),(await fetch("/api/auth/mobile/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t})})).ok?(console.log("✅ Mobile auth verification successful"),window.location.reload()):console.error("❌ Token verification failed")}catch(o){console.error("❌ Error verifying token:",o)}}export{p as setupMobileAuth,h as startMobileAuth};
