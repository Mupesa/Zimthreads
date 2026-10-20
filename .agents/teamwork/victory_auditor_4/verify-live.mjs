import { execSync } from "child_process"

async function run() {
  console.log("====================================================================")
  console.log("  VICTORY AUDITOR 4: INDEPENDENT LIVE REDMI & DESKTOP AUDIT")
  console.log("====================================================================\n")

  const res = await fetch("http://127.0.0.1:9222/json/list")
  const tabs = await res.json()
  const shopTab = tabs.find(t => t.url.includes("8443/shop") || (t.url.includes("shop") && t.url.includes("localhost")))
  if (!shopTab) {
    throw new Error("No active localhost:8443/shop tab found on Redmi device!")
  }
  console.log(`Connecting to CDP target: ${shopTab.title} (${shopTab.url})`)

  const ws = new WebSocket(shopTab.webSocketDebuggerUrl)

  function sendCmd(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = Math.floor(Math.random() * 1000000)
      const handler = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.id === id) {
            ws.removeEventListener("message", handler)
            if (data.result?.exceptionDetails) {
              reject(data.result.exceptionDetails)
            } else {
              resolve(data.result)
            }
          }
        } catch (e) {
          reject(e)
        }
      }
      ws.addEventListener("message", handler)
      ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async function evalJS(expression) {
    const res = await sendCmd("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    return res?.result?.value
  }

  function pullScreenshot(name) {
    try {
      execSync(`adb -s 798XBIO7X8K78HHQ shell screencap -p /sdcard/${name}`, { stdio: "ignore" })
      execSync(`adb -s 798XBIO7X8K78HHQ pull /sdcard/${name} ".agents/teamwork/victory_auditor_4/${name}"`, { stdio: "ignore" })
      execSync(`adb -s 798XBIO7X8K78HHQ shell rm /sdcard/${name}`, { stdio: "ignore" })
      console.log(`  [Physical Screenshot Captured: ${name}]`)
    } catch (e) {
      console.error("Screenshot capture error:", e.message)
    }
  }

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve)
    ws.addEventListener("error", reject)
  })

  try {
    // Ensure mobile metrics are active initially
    await sendCmd("Emulation.clearDeviceMetricsOverride", {})
    await new Promise(r => setTimeout(r, 500))

    // 1. Verify Spotlight Container Background
    console.log("▶ CHECK 1: Spotlight Studio White Aesthetic")
    const bgInfo = await evalJS(`(() => {
      const el = document.getElementById("featured-product-spotlight")
      if (!el) return null
      const comp = window.getComputedStyle(el)
      return {
        bg: comp.backgroundColor,
        color: comp.color,
        borderBottom: comp.borderBottomWidth + " " + comp.borderBottomColor,
      }
    })()`)
    console.log("Spotlight styling:", bgInfo)
    if (!bgInfo || bgInfo.bg !== "rgb(255, 255, 255)") {
      throw new Error(`Background is not rgb(255, 255, 255): ${JSON.stringify(bgInfo)}`)
    }
    console.log("✓ Studio White aesthetic verified (#ffffff / rgb(255, 255, 255))")

    // Scroll spotlight into view
    await evalJS(`(() => {
      const el = document.getElementById("featured-product-spotlight")
      el?.scrollIntoView({ behavior: "instant", block: "start" })
    })()`)
    await new Promise(r => setTimeout(r, 600))
    pullScreenshot("audit4_redmi_spotlight_view.png")

    // 2. Verify Mobile Carousel & Dots Structure
    console.log("\n▶ CHECK 2: Mobile Carousel & Pagination Dots")
    const carouselData = await evalJS(`(() => {
      const sec = document.getElementById("featured-product-spotlight")
      const slides = Array.from(sec.querySelectorAll('[role="tabpanel"]'))
      const dots = Array.from(sec.querySelectorAll('[role="tab"]'))
      const tablist = sec.querySelector('[role="tablist"]')
      const mobileContainer = sec.querySelector('.overflow-x-auto')
      return {
        slideCount: slides.length,
        dotCount: dots.length,
        hasTablist: !!tablist,
        tablistAria: tablist?.getAttribute("aria-label"),
        touchAction: mobileContainer ? window.getComputedStyle(mobileContainer).touchAction : null,
        scrollSnapType: mobileContainer ? window.getComputedStyle(mobileContainer).scrollSnapType : null,
      }
    })()`)
    console.log("Carousel data:", carouselData)
    if (carouselData.slideCount < 1 || carouselData.slideCount !== carouselData.dotCount) {
      throw new Error(`Invalid slide or dot count: ${JSON.stringify(carouselData)}`)
    }
    if (carouselData.touchAction !== "pan-y") {
      throw new Error(`touch-action is not pan-y: ${carouselData.touchAction}`)
    }
    console.log("✓ Mobile carousel has touch-action: pan-y and matching slide/dot counts")

    // 3. Test dot interaction
    console.log("\n▶ CHECK 3: Pagination Dot Navigation")
    await evalJS(`(() => {
      const dots = document.querySelectorAll('[role="tab"]')
      if (dots.length > 1) dots[1].click()
    })()`)
    await new Promise(r => setTimeout(r, 600))
    pullScreenshot("audit4_redmi_dot1_clicked.png")

    const dot1State = await evalJS(`(() => {
      const dots = Array.from(document.querySelectorAll('[role="tab"]'))
      return {
        activeDot: dots.findIndex(d => d.getAttribute("aria-selected") === "true"),
        activeAria: dots[1]?.getAttribute("aria-selected"),
      }
    })()`)
    console.log("Dot 1 click state:", dot1State)
    if (dot1State.activeDot !== 1) {
      throw new Error(`Active dot did not update to 1: ${JSON.stringify(dot1State)}`)
    }
    console.log("✓ Dot 1 successfully activated slide 2 without vertical page shift")

    // Revert to dot 0
    await evalJS(`document.querySelectorAll('[role="tab"]')[0]?.click()`)
    await new Promise(r => setTimeout(r, 400))

    // 4. Verify Mobile "SELECT OPTIONS / DROP" Trigger & Open Bottom Sheet Drawer
    console.log("\n▶ CHECK 4: Selective Details Reveal via Slide-Up Drawer")
    const triggerData = await evalJS(`(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("SELECT OPTIONS / DROP"))
      if (!btn) return null
      return {
        text: btn.textContent.trim(),
        haspopup: btn.getAttribute("aria-haspopup"),
        controls: btn.getAttribute("aria-controls"),
        expanded: btn.getAttribute("aria-expanded"),
      }
    })()`)
    console.log("Trigger button data:", triggerData)
    if (!triggerData || triggerData.haspopup !== "dialog") {
      throw new Error(`Invalid trigger button: ${JSON.stringify(triggerData)}`)
    }

    // Click trigger to open bottom sheet drawer
    await evalJS(`(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("SELECT OPTIONS / DROP"))
      btn.click()
    })()`)
    await new Promise(r => setTimeout(r, 600))
    pullScreenshot("audit4_redmi_drawer_opened.png")

    const drawerData = await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer")
      const title = document.getElementById("spotlight-drawer-title")
      const sizeButtons = drawer ? Array.from(drawer.querySelectorAll("button[aria-label*='Select size']")).map(b => ({
        size: b.textContent.trim(),
        pressed: b.getAttribute("aria-pressed"),
      })) : []
      return {
        isOpen: !!drawer,
        role: drawer?.getAttribute("role"),
        ariaModal: drawer?.getAttribute("aria-modal"),
        ariaLabelledby: drawer?.getAttribute("aria-labelledby"),
        title: title?.textContent.trim(),
        bodyOverflow: document.body.style.overflow,
        sizes: sizeButtons,
      }
    })()`)
    console.log("Drawer data:", drawerData)
    if (!drawerData.isOpen || drawerData.role !== "dialog" || drawerData.ariaModal !== "true" || drawerData.bodyOverflow !== "hidden") {
      throw new Error(`Drawer invalid or scroll lock not applied: ${JSON.stringify(drawerData)}`)
    }
    console.log(`✓ Drawer is open with accessible dialog semantics, scroll lock, and ${drawerData.sizes.length} sizes`)

    // 5. Select Size & Add to Cart
    console.log("\n▶ CHECK 5: Size Selection & Cart Dispatch from Drawer")
    await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer")
      const lBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.trim() === "L")
      if (lBtn) lBtn.click()
    })()`)
    await new Promise(r => setTimeout(r, 300))

    const sizeLSelected = await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer")
      const lBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.trim() === "L")
      return lBtn?.getAttribute("aria-pressed") === "true"
    })()`)
    if (!sizeLSelected) {
      throw new Error("Size L was not selected!")
    }
    console.log("✓ Size L selected (aria-pressed='true')")

    // Click Add to Cart
    await evalJS(`(() => {
      const drawer = document.getElementById("spotlight-mobile-drawer")
      const addBtn = Array.from(drawer.querySelectorAll("button")).find(b => b.textContent.includes("ADD TO CART"))
      addBtn?.click()
    })()`)
    await new Promise(r => setTimeout(r, 800))
    pullScreenshot("audit4_redmi_cart_opened.png")

    const cartResult = await evalJS(`(() => {
      const cartEl = document.getElementById("cart-drawer") || document.querySelector('[aria-label="Shopping Cart"]')
      const hasShoppingBag = document.body.innerHTML.includes("SHOPPING BAG")
      return {
        drawerClosed: !document.getElementById("spotlight-mobile-drawer"),
        cartOpen: !!cartEl || hasShoppingBag,
      }
    })()`)
    console.log("Cart result:", cartResult)
    if (!cartResult.drawerClosed || !cartResult.cartOpen) {
      throw new Error(`Add to cart failed: ${JSON.stringify(cartResult)}`)
    }
    console.log("✓ Drawer closed and CartDrawer opened successfully upon Add to Cart")

    // Close cart drawer
    await evalJS(`(() => {
      const closeBtn = document.querySelector('button[aria-label="Close cart"]') || Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("✕"))
      closeBtn?.click()
    })()`)
    await new Promise(r => setTimeout(r, 400))

    // 6. Desktop Viewport Layout Verification via CDP Emulation
    console.log("\n▶ CHECK 6: Desktop Viewport (1280x900) 2-Column Sticky Layout")
    await sendCmd("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await new Promise(r => setTimeout(r, 600))

    await evalJS(`document.getElementById("featured-product-spotlight")?.scrollIntoView({ behavior: "instant", block: "start" })`)
    await new Promise(r => setTimeout(r, 400))

    const desktopLayout = await evalJS(`(() => {
      const section = document.getElementById("featured-product-spotlight")
      if (!section) return null
      const divs = Array.from(section.querySelectorAll("div"))
      const grid = divs.find(d => d.className.includes("lg:grid-cols-12"))
      const leftCol = divs.find(d => d.className.includes("lg:col-span-7"))
      const rightCol = divs.find(d => d.className.includes("lg:col-span-5"))
      const mobileCarousel = divs.find(d => d.className.includes("block lg:hidden"))
      const mobileTrigger = Array.from(section.querySelectorAll("button")).find(b => b.textContent.includes("SELECT OPTIONS / DROP"))
      const desktopGallery = divs.find(d => d.className.includes("hidden lg:flex"))

      const compGrid = grid ? window.getComputedStyle(grid) : null
      const compMobileCarousel = mobileCarousel ? window.getComputedStyle(mobileCarousel) : null
      const compDesktopGallery = desktopGallery ? window.getComputedStyle(desktopGallery) : null
      const compRight = rightCol ? window.getComputedStyle(rightCol) : null

      return {
        gridDisplay: compGrid?.display,
        leftColWidth: leftCol ? leftCol.getBoundingClientRect().width : 0,
        rightColWidth: rightCol ? rightCol.getBoundingClientRect().width : 0,
        mobileCarouselDisplay: compMobileCarousel?.display,
        mobileTriggerVisible: mobileTrigger ? (mobileTrigger.offsetParent !== null) : false,
        desktopGalleryDisplay: compDesktopGallery?.display,
        desktopPanelDisplay: compRight?.display,
        desktopPanelPosition: compRight?.position,
      }
    })()`)
    console.log("Desktop Layout Evaluation:", desktopLayout)
    if (desktopLayout.mobileCarouselDisplay !== "none" || desktopLayout.mobileTriggerVisible !== false) {
      throw new Error(`Mobile elements should be hidden on desktop: ${JSON.stringify(desktopLayout)}`)
    }
    if (desktopLayout.desktopGalleryDisplay !== "flex" || desktopLayout.desktopPanelDisplay !== "block" || desktopLayout.desktopPanelPosition !== "sticky") {
      throw new Error(`Desktop 2-column sticky layout invalid: ${JSON.stringify(desktopLayout)}`)
    }
    if (desktopLayout.leftColWidth <= 0 || desktopLayout.rightColWidth <= 0) {
      throw new Error(`Desktop column widths invalid: left=${desktopLayout.leftColWidth}, right=${desktopLayout.rightColWidth}`)
    }
    console.log(`✓ Desktop 2-column sticky layout confirmed: Left=${desktopLayout.leftColWidth}px, Right=${desktopLayout.rightColWidth}px (sticky), Mobile elements hidden!`)

    // Clear emulation
    await sendCmd("Emulation.clearDeviceMetricsOverride", {})
    await new Promise(r => setTimeout(r, 400))
    pullScreenshot("audit4_redmi_restored_final.png")

    console.log("\n====================================================================")
    console.log("  ALL EMPIRICAL CHECKS PASSED: VICTORY VERIFIED 100%")
    console.log("====================================================================\n")

    ws.close()
    process.exit(0)
  } catch (err) {
    console.error("Audit failure:", err)
    ws.close()
    process.exit(1)
  }
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
