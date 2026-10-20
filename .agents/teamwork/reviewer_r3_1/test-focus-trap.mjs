// Test focus trapping when drawer is open
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
    const activeEl = await evaluate("document.activeElement.tagName + '.' + document.activeElement.className");
    console.log("Current active element while drawer is open:", activeEl);
    ws.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    ws.close();
    process.exit(1);
  }
});
