// Verify Redmi live interaction and visual alignment
const res = await fetch("http://127.0.0.1:9222/json/list");
const tabs = await res.json();
const tab = tabs.find(t => t.url.includes("192.168.100.3:8443") || t.url.includes("8443/shop"));

if (!tab) {
  console.error("No shop tab found on Redmi");
  process.exit(1);
}

const ws = new WebSocket(tab.webSocketDebuggerUrl);

function evaluate(expression) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener("message", handler);
        if (data.result?.exceptionDetails) {
          reject(new Error(JSON.stringify(data.result.exceptionDetails)));
        } else {
          resolve(data.result?.result?.value);
        }
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({
      id,
      method: "Runtime.evaluate",
      params: {
        expression,
        returnByValue: true,
        awaitPromise: true,
      },
    }));
  });
}

ws.addEventListener("open", async () => {
  try {
    // 1. Reload the page to pick up latest build/HMR
    console.log("Reloading shop tab on device...");
    await evaluate("location.reload()");
    await new Promise(r => setTimeout(r, 2000));

    // 2. Scroll to spotlight
    console.log("Scrolling to spotlight...");
    await evaluate(`
      const spotlight = document.querySelector('#featured-product-spotlight');
      if (spotlight) spotlight.scrollIntoView({ behavior: 'instant', block: 'start' });
    `);
    await new Promise(r => setTimeout(r, 600));

    // 3. Inspect spotlight attributes
    const info = await evaluate(`
      (() => {
        const spotlight = document.querySelector('#featured-product-spotlight');
        const trigger = spotlight?.querySelector('button[aria-haspopup="dialog"]');
        const dots = Array.from(spotlight?.querySelectorAll('[role="tab"]') || []).map(d => ({
          ariaLabel: d.getAttribute('aria-label'),
          ariaControls: d.getAttribute('aria-controls'),
          selected: d.getAttribute('aria-selected')
        }));
        const slides = Array.from(spotlight?.querySelectorAll('[role="tabpanel"]') || []).map(s => ({
          id: s.id,
          ariaLabelledby: s.getAttribute('aria-labelledby')
        }));
        return {
          spotlightFound: !!spotlight,
          triggerText: trigger?.textContent.trim(),
          triggerHasPopup: trigger?.getAttribute('aria-haspopup'),
          dots,
          slides
        };
      })()
    `);
    console.log("Spotlight live DOM:", JSON.stringify(info, null, 2));

    // 4. Click trigger to open drawer
    console.log("Opening drawer...");
    await evaluate(`
      const trigger = document.querySelector('#featured-product-spotlight button[aria-haspopup="dialog"]');
      if (trigger) trigger.click();
    `);
    await new Promise(r => setTimeout(r, 500));

    // 5. Inspect drawer attributes & focused element
    const drawerState = await evaluate(`
      (() => {
        const drawer = document.querySelector('#spotlight-mobile-drawer');
        const activeEl = document.activeElement;
        const pullHandle = drawer?.querySelector('.rounded-full.bg-\\\\[\\\\#d1d5db\\\\]');
        const pullHandleParent = pullHandle?.parentElement;
        const titleEl = drawer?.querySelector('#spotlight-drawer-title');
        const closeBtn = drawer?.querySelector('button[aria-label="Close options drawer"]');
        return {
          drawerOpen: !!drawer,
          focusedElement: activeEl ? (activeEl.tagName + ' ' + (activeEl.getAttribute('aria-label') || activeEl.textContent.trim())) : null,
          pullHandleCentered: pullHandleParent?.className.includes('justify-center'),
          title: titleEl?.textContent.trim(),
          titleClasses: titleEl?.className,
          hasCloseBtn: !!closeBtn
        };
      })()
    `);
    console.log("Drawer live state:", JSON.stringify(drawerState, null, 2));

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    ws.close();
    process.exit(1);
  }
});

ws.addEventListener("error", (err) => {
  console.error("WS error:", err);
  process.exit(1);
});
