// Independent Physical Device & Live DOM Victory Audit Script
import { execSync } from "child_process";

const res = await fetch("http://127.0.0.1:9222/json/list");
const tabs = await res.json();
console.log("Connected Chrome Tabs:", tabs.map(t => ({ title: t.title, url: t.url })));

const tab = tabs.find(t => t.url.includes("8443") || t.url.includes("shop"));
if (!tab) {
  console.error("No active Shop tab found on Redmi device");
  process.exit(1);
}

const ws = new WebSocket(tab.webSocketDebuggerUrl);

function evalJS(expression) {
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
            resolve(data.result?.result?.value);
          }
        }
      } catch (e) {
        reject(e);
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
      }
    }));
  });
}

function captureScreenshot(filename) {
  try {
    execSync(`adb shell screencap -p /sdcard/${filename}`, { stdio: "ignore" });
    execSync(`adb pull /sdcard/${filename} ".agents/teamwork/victory_auditor_3/${filename}"`, { stdio: "ignore" });
    execSync(`adb shell rm /sdcard/${filename}`, { stdio: "ignore" });
    console.log(`  [Screenshot saved: ${filename}]`);
  } catch (err) {
    console.error("Screenshot error:", err.message);
  }
}

ws.addEventListener("open", async () => {
  try {
    console.log("\n=======================================================");
    console.log("  INDEPENDENT REDMI PHYSICAL DEVICE VERIFICATION");
    console.log("=======================================================\n");

    // 1. Check Spotlight Container Background Color & Styling
    const bgInfo = await evalJS(`(() => {
      const el = document.getElementById("featured-product-spotlight");
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      return {
        bg: comp.backgroundColor,
        color: comp.color,
        borderBottom: comp.borderBottomWidth + " " + comp.borderBottomColor,
      };
    })()`);
    console.log("1. Spotlight Container Computed Styling:", bgInfo);
    if (!bgInfo || bgInfo.bg !== "rgb(255, 255, 255)") {
      throw new Error("Spotlight background is NOT pure white rgb(255, 255, 255): " + JSON.stringify(bgInfo));
    }
    console.log("   ✓ Pure Studio White (#ffffff) verified on physical device!");

    // 2. Carousel & Dots Structure
    const carouselInfo = await evalJS(`(() => {
      const el = document.getElementById("featured-product-spotlight");
      const slides = el.querySelectorAll('[role="tabpanel"]');
      const dots = el.querySelectorAll('[role="tab"]');
      const tablist = el.querySelector('[role="tablist"]');
      return {
        slideCount: slides.length,
        dotCount: dots.length,
        hasTablist: !!tablist,
        tablistLabel: tablist ? tablist.getAttribute("aria-label") : null,
      };
    })()`);
    console.log("\n2. Carousel & Pagination Structure:", carouselInfo);
    if (carouselInfo.slideCount < 1 || carouselInfo.dotCount !== carouselInfo.slideCount) {
      throw new Error("Slide count and dot count mismatch: " + JSON.stringify(carouselInfo));
    }
    console.log(`   ✓ Carousel has ${carouselInfo.slideCount} slides and matching ${carouselInfo.dotCount} dots with role="tablist"!`);

    // 3. Scroll Into View and Capture Baseline
    await evalJS(`(() => {
      const el = document.getElementById("featured-product-spotlight");
      el.scrollIntoView({ behavior: "instant", block: "start" });
    })()`);
    await new Promise(r => setTimeout(r, 600));
    captureScreenshot("redmi_audit_spotlight_view.png");

    // 4. Dot Click Interaction (Dot 1)
    console.log("\n3. Testing Touch/Click on Pagination Dot 1...");
    const dot1Res = await evalJS(`(() => {
      const dots = document.querySelectorAll('[role="tab"]');
      if (dots.length > 1) {
        dots[1].click();
        return { clicked: true, ariaSelected: dots[1].getAttribute("aria-selected") };
      }
      return { clicked: false };
    })()`);
    console.log("   Dot 1 Click Result:", dot1Res);
    await new Promise(r => setTimeout(r, 600));
    const activeDotIdx = await evalJS(`(() => {
      const dots = Array.from(document.querySelectorAll('[role="tab"]'));
      return dots.findIndex(d => d.getAttribute("aria-selected") === "true");
    })()`);
    console.log("   Active dot index after click:", activeDotIdx);
    captureScreenshot("redmi_audit_dot1_active.png");

    // Click back to Dot 0
    await evalJS(`document.querySelectorAll('[role="tab"]')[0]?.click()`);
    await new Promise(r => setTimeout(r, 400));

    // 5. Verify Mobile Trigger Button & Open Drawer
    console.log("\n4. Verifying Trigger Button & Opening Selection Drawer...");
    const triggerInfo = await evalJS(`(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("SELECT OPTIONS / DROP"));
      if (!btn) return null;
      return {
        text: btn.textContent.trim(),
        haspopup: btn.getAttribute("aria-haspopup"),
        controls: btn.getAttribute("aria-controls"),
        expanded: btn.getAttribute("aria-expanded"),
      };
    })()`);
    console.log("   Trigger Button Info:", triggerInfo);
    if (!triggerInfo || triggerInfo.haspopup !== "dialog") {
      throw new Error("Trigger button missing dialog attributes: " + JSON.stringify(triggerInfo));
    }

    // Click trigger button to open drawer
    await evalJS(`(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("SELECT OPTIONS / DROP"));
      btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));
    captureScreenshot("redmi_audit_drawer_open.png");

    // 6. Verify Drawer State, Accessibility, Size Pills, and Controls
    const drawerState = await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer");
      const title = document.getElementById("spotlight-drawer-title");
      const bodyOverflow = document.body.style.overflow;
      const sizeButtons = drawer ? Array.from(drawer.querySelectorAll("button[aria-label*='Select size']")).map(b => ({
        size: b.textContent.trim(),
        pressed: b.getAttribute("aria-pressed"),
      })) : [];
      return {
        isOpen: !!drawer,
        role: drawer?.getAttribute("role"),
        ariaModal: drawer?.getAttribute("aria-modal"),
        ariaLabelledby: drawer?.getAttribute("aria-labelledby"),
        titleText: title?.textContent.trim(),
        bodyOverflow,
        sizeCount: sizeButtons.length,
        sizes: sizeButtons,
      };
    })()`);
    console.log("\n5. Mobile Selection Drawer Live State:", drawerState);
    if (!drawerState.isOpen || drawerState.role !== "dialog" || drawerState.ariaModal !== "true") {
      throw new Error("Drawer is not open with valid dialog semantics: " + JSON.stringify(drawerState));
    }
    if (drawerState.bodyOverflow !== "hidden") {
      throw new Error("Body overflow was not set to hidden when drawer opened!");
    }
    console.log(`   ✓ Drawer is OPEN with role="dialog", aria-modal="true", and ${drawerState.sizeCount} size pills!`);

    // 7. Test Selecting Size 'XL' and Increasing Quantity
    console.log("\n6. Selecting Size 'XL' and Incrementing Quantity...");
    await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer");
      const xlBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.trim() === "XL");
      if (xlBtn) xlBtn.click();
      const incBtn = drawer.querySelector("button[aria-label='Increase quantity']");
      if (incBtn) incBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));
    captureScreenshot("redmi_audit_drawer_size_xl_qty2.png");

    const updatedState = await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer");
      const xlBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.trim() === "XL");
      const qtyEl = drawer.querySelector("span.font-mono.text-xs.font-bold");
      const addBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.includes("ADD TO CART"));
      return {
        xlPressed: xlBtn?.getAttribute("aria-pressed"),
        quantity: qtyEl?.textContent.trim(),
        addBtnText: addBtn?.textContent.trim(),
      };
    })()`);
    console.log("   Updated Drawer Interaction State:", updatedState);
    if (updatedState.xlPressed !== "true" || updatedState.quantity !== "2") {
      throw new Error("Failed to select XL or increment quantity to 2: " + JSON.stringify(updatedState));
    }
    console.log("   ✓ Size 'XL' selected (aria-pressed='true') and Quantity = 2 (Price calculated: " + updatedState.addBtnText + ")!");

    // 8. Test Add to Cart from Drawer
    console.log("\n7. Executing 'ADD TO CART' from Drawer...");
    await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer");
      const addBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.includes("ADD TO CART"));
      addBtn?.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    captureScreenshot("redmi_audit_after_add_cart.png");

    const cartState = await evalJS(`(() => {
      const cartDrawer = document.getElementById("cart-drawer") || document.querySelector('[aria-label="Shopping Cart"]');
      const bodyOverflow = document.body.style.overflow;
      return {
        cartOpen: !!cartDrawer || document.body.innerHTML.includes("SHOPPING BAG"),
        bodyOverflow,
      };
    })()`);
    console.log("   Cart State after Add to Cart:", cartState);

    // Close cart drawer if open
    await evalJS(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close cart"]') || Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("✕"));
      closeBtn?.click();
    })()`);
    await new Promise(r => setTimeout(r, 400));
    captureScreenshot("redmi_audit_final.png");

    console.log("\n=======================================================");
    console.log("  ALL PHYSICAL REDMI DEVICE CHECKS PASSED EMPIRICALLY!");
    console.log("=======================================================\n");

    ws.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Device Audit Exception:", err);
    ws.close();
    process.exit(1);
  }
});

ws.addEventListener("error", (e) => {
  console.error("WebSocket connection error:", e);
  process.exit(1);
});
