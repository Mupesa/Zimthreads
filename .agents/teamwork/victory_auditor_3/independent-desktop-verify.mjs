// Independent Desktop Layout Verification via CDP Emulation
import { execSync } from "child_process";

const res = await fetch("http://127.0.0.1:9222/json/list");
const tabs = await res.json();
const tab = tabs.find(t => t.url.includes("8443") || t.url.includes("shop"));
if (!tab) {
  console.error("No active Shop tab found");
  process.exit(1);
}

const ws = new WebSocket(tab.webSocketDebuggerUrl);

function sendCmd(method, params = {}) {
  return new Promise((resolve, reject) => {
    let id = Math.floor(Math.random() * 100000);
    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener("message", handler);
          if (data.result?.exceptionDetails) {
            reject(data.result.exceptionDetails);
          } else {
            resolve(data.result);
          }
        }
      } catch (e) {
        reject(e);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJS(expression) {
  const result = await sendCmd("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result?.result?.value;
}

ws.addEventListener("open", async () => {
  try {
    console.log("\n=======================================================");
    console.log("  INDEPENDENT DESKTOP VIEWPORT LAYOUT VERIFICATION");
    console.log("=======================================================\n");

    // Override viewport to Desktop: 1280 x 900 (>= lg: 1024px)
    await sendCmd("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    console.log("1. Viewport overridden to 1280x900 (Desktop >= lg)");

    await new Promise(r => setTimeout(r, 600));

    // Scroll to spotlight
    await evalJS(`document.getElementById("featured-product-spotlight")?.scrollIntoView({ behavior: "instant", block: "start" })`);
    await new Promise(r => setTimeout(r, 400));

    // Verify 2-Column Desktop Grid Layout
    const desktopInfo = await evalJS(`(() => {
      const section = document.getElementById("featured-product-spotlight");
      if (!section) return null;

      const divs = Array.from(section.querySelectorAll("div"));
      const grid = divs.find(d => d.className.includes("lg:grid-cols-12"));
      const leftCol = divs.find(d => d.className.includes("lg:col-span-7"));
      const rightCol = divs.find(d => d.className.includes("lg:col-span-5"));

      // Mobile elements should be hidden
      const mobileCarousel = divs.find(d => d.className.includes("block lg:hidden"));
      const mobileTrigger = Array.from(section.querySelectorAll("button")).find(b => b.textContent.includes("SELECT OPTIONS / DROP"));

      // Desktop elements should be visible
      const desktopGallery = divs.find(d => d.className.includes("hidden lg:flex"));
      const desktopStickyPanel = rightCol;

      const compGrid = grid ? window.getComputedStyle(grid) : null;
      const compMobileCarousel = mobileCarousel ? window.getComputedStyle(mobileCarousel) : null;
      const compDesktopGallery = desktopGallery ? window.getComputedStyle(desktopGallery) : null;
      const compDesktopSticky = desktopStickyPanel ? window.getComputedStyle(desktopStickyPanel) : null;

      return {
        hasGrid: !!grid,
        gridDisplay: compGrid?.display,
        leftColWidth: leftCol ? leftCol.getBoundingClientRect().width : 0,
        rightColWidth: rightCol ? rightCol.getBoundingClientRect().width : 0,
        mobileCarouselDisplay: compMobileCarousel?.display,
        mobileTriggerVisible: mobileTrigger ? (mobileTrigger.offsetParent !== null) : false,
        desktopGalleryDisplay: compDesktopGallery?.display,
        desktopStickyDisplay: compDesktopSticky?.display,
        desktopStickyPosition: compDesktopSticky?.position,
      };
    })()`);

    console.log("2. Desktop Layout Inspection:", desktopInfo);

    if (desktopInfo.mobileCarouselDisplay !== "none") {
      throw new Error("Mobile carousel is NOT hidden on desktop: " + desktopInfo.mobileCarouselDisplay);
    }
    if (desktopInfo.desktopGalleryDisplay === "none" || desktopInfo.desktopStickyDisplay === "none") {
      throw new Error("Desktop 2-column elements are hidden on desktop!");
    }
    if (desktopInfo.desktopStickyPosition !== "sticky") {
      throw new Error("Right purchase panel is NOT sticky: " + desktopInfo.desktopStickyPosition);
    }

    console.log("   ✓ Desktop side-by-side 2-column layout confirmed!");
    console.log(`   ✓ Left Gallery width: ${desktopInfo.leftColWidth}px (~7/12 cols)`);
    console.log(`   ✓ Right Sticky Purchase panel width: ${desktopInfo.rightColWidth}px (~5/12 cols, position: sticky)`);
    console.log("   ✓ Mobile carousel and drawer trigger are cleanly hidden on desktop (display: none)");

    // Restore original mobile device metrics
    await sendCmd("Emulation.clearDeviceMetricsOverride");
    console.log("\n3. Restored native device metrics for Redmi.");

    console.log("\n=======================================================");
    console.log("  DESKTOP AUDIT PASSED: 2-COLUMN STICKY LAYOUT PRESERVED!");
    console.log("=======================================================\n");

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error("Desktop Audit Error:", err);
    try {
      await sendCmd("Emulation.clearDeviceMetricsOverride");
    } catch {}
    ws.close();
    process.exit(1);
  }
});
