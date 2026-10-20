// Script to inspect live DOM on Redmi device
const res = await fetch("http://127.0.0.1:9222/json/list");
const tabs = await res.json();
const tab = tabs.find(t => t.url.includes("192.168.100.3:8443") || t.url.includes("8443/shop"));

if (!tab) {
  console.error("No shop tab found on device");
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
    const info = await evaluate(`
      (() => {
        const spotlight = document.querySelector('#featured-product-spotlight');
        if (!spotlight) return { found: false };
        const trigger = spotlight.querySelector('button[aria-haspopup="dialog"]');
        const dots = Array.from(spotlight.querySelectorAll('[role="tab"]')).map(d => ({
          label: d.getAttribute('aria-label'),
          selected: d.getAttribute('aria-selected')
        }));
        const drawer = document.querySelector('#spotlight-mobile-drawer');
        const images = Array.from(spotlight.querySelectorAll('img')).map(img => img.src);
        return {
          found: true,
          triggerText: trigger ? trigger.textContent.trim() : null,
          dots,
          drawerOpen: !!drawer,
          imagesCount: images.length
        };
      })()
    `);
    console.log("Spotlight on device:", JSON.stringify(info, null, 2));

    // Now let's trigger drawer open
    const openRes = await evaluate(`
      (() => {
        const trigger = document.querySelector('#featured-product-spotlight button[aria-haspopup="dialog"]');
        if (trigger) {
          trigger.click();
          return true;
        }
        return false;
      })()
    `);
    console.log("Trigger clicked:", openRes);

    // Wait 400ms and check drawer
    await new Promise(r => setTimeout(r, 400));
    const drawerInfo = await evaluate(`
      (() => {
        const drawer = document.querySelector('#spotlight-mobile-drawer');
        if (!drawer) return { open: false };
        const title = drawer.querySelector('#spotlight-drawer-title')?.textContent;
        const sizeButtons = Array.from(drawer.querySelectorAll('button[aria-pressed]')).map(b => ({
          text: b.textContent.trim(),
          pressed: b.getAttribute('aria-pressed')
        }));
        const closeBtn = drawer.querySelector('button[aria-label="Close options drawer"]');
        return {
          open: true,
          title,
          sizeButtons,
          hasCloseBtn: !!closeBtn
        };
      })()
    `);
    console.log("Drawer info:", JSON.stringify(drawerInfo, null, 2));

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error("Evaluation error:", err);
    ws.close();
    process.exit(1);
  }
});

ws.addEventListener("error", (err) => {
  console.error("WS error:", err);
  process.exit(1);
});
