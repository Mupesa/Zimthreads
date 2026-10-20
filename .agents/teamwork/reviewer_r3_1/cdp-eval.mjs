// Helper to evaluate JS in the active Chrome mobile tab via CDP
const expression = process.argv[2] || "document.title";

const res = await fetch("http://127.0.0.1:9222/json/list");
const tabs = await res.json();
const tab = tabs.find(t => t.url.includes("192.168.100.3:8443") || t.url.includes("8443/shop"));

if (!tab) {
  console.error("No shop tab found");
  process.exit(1);
}

const ws = new WebSocket(tab.webSocketDebuggerUrl);

ws.addEventListener("open", () => {
  const msg = {
    id: 1,
    method: "Runtime.evaluate",
    params: {
      expression,
      returnByValue: true,
      awaitPromise: true,
    },
  };
  ws.send(JSON.stringify(msg));
});

ws.addEventListener("message", (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data.id === 1) {
      if (data.result?.exceptionDetails) {
        console.error("Exception:", data.result.exceptionDetails);
      } else {
        console.log(JSON.stringify(data.result?.result?.value, null, 2));
      }
      ws.close();
      process.exit(0);
    }
  } catch (err) {
    console.error("Parse error:", err);
    process.exit(1);
  }
});

ws.addEventListener("error", (err) => {
  console.error("WS error:", err);
  process.exit(1);
});

setTimeout(() => {
  console.error("Timeout waiting for response");
  process.exit(1);
}, 4000);
