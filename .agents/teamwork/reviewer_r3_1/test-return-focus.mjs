// Test return focus after closing drawer
const res = await fetch("http://127.0.0.1:9222/json/list");
const tabs = await res.json();
const tab = tabs.find(t => t.url.includes("192.168.100.3:8443") || t.url.includes("8443/shop"));

if (!tab) {
  console.error("No shop tab found");
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
    // 1. Ensure drawer is closed or close it
    await evaluate(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close options drawer"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 200));

    // 2. Click trigger
    await evaluate(`(() => {
      const trigger = document.querySelector('button[aria-controls="spotlight-mobile-drawer"]');
      if (trigger) trigger.click();
    })()`);
    await new Promise(r => setTimeout(r, 200));

    // 3. Verify focused inside drawer
    const elInside = await evaluate(`(() => document.activeElement.getAttribute('aria-label') || document.activeElement.tagName)()`);
    console.log("Element focused inside drawer:", elInside);

    // 4. Close drawer via Escape key
    await evaluate(`(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    })()`);
    await new Promise(r => setTimeout(r, 200));

    // 5. Verify focus restored to trigger
    const elAfterClose = await evaluate(`(() => document.activeElement.textContent.trim())()`);
    console.log("Element focused after Escape close:", elAfterClose);

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    ws.close();
    process.exit(1);
  }
});
