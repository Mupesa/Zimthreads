/**
 * scripts/audit-milestone7-forensic.mjs
 * 
 * Independent Forensic Audit Suite for Milestone 7:
 * - Direct empirical verification of Neon PostgreSQL (rapid-hill-42448439).
 * - Verifies prod-5 has 2XL and XXL sizes.
 * - Simulates full admin sync payload containing preset + custom sizes and active/inactive price tiers.
 * - Verifies API layer security (rejection of unauthenticated sync).
 * - Verifies database JSONB roundtrip fidelity.
 * - Ensures zero residuals and baseline integrity.
 */

import { executeSql } from "../api/store.ts"
import handler from "../api/store.ts"

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, val) {
      this.headers[key] = val
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(obj) {
      this.body = obj
      return this
    },
    end() {
      return this
    },
  }
  return res
}

async function runForensicAudit() {
  console.log("=== INDEPENDENT FORENSIC AUDIT: MILESTONE 7 ===")

  // Check 1: Live Database Connection & Baseline Product Catalog
  console.log("\n[Check 1] Verifying live connection to Neon PostgreSQL (rapid-hill-42448439)...")
  const baselineRows = await executeSql("SELECT key, data, updated_at FROM public.zimthreads_store WHERE key = 'products';")
  if (!baselineRows || baselineRows.length === 0) {
    throw new Error("Neon DB returned empty query for key 'products'!")
  }
  const baselineProducts = baselineRows[0].data
  if (!Array.isArray(baselineProducts) || baselineProducts.length === 0) {
    throw new Error("Products data in Neon DB is not a non-empty array!")
  }
  console.log(`[Check 1 PASS] Retrieved ${baselineProducts.length} products from live Neon DB. Updated at: ${baselineRows[0].updated_at}`)

  // Check 2: Verify prod-5 size options
  console.log("\n[Check 2] Verifying prod-5 ('LLICYLAND' Graphic Boxy Tee) size options in Neon DB...")
  const prod5 = baselineProducts.find((p) => p.id === "prod-5")
  if (!prod5) {
    throw new Error("Product 'prod-5' not found in live Neon DB!")
  }
  console.log(`prod-5 sizes in Neon DB: ${JSON.stringify(prod5.sizes)}`)
  if (!Array.isArray(prod5.sizes)) {
    throw new Error("prod-5 sizes is not an array!")
  }
  const requiredSizes = ["S", "M", "L", "XL", "2XL", "XXL"]
  for (const size of requiredSizes) {
    if (!prod5.sizes.includes(size)) {
      throw new Error(`prod-5 is missing required size: '${size}'`)
    }
  }
  console.log("[Check 2 PASS] prod-5 contains all required sizes including 2XL and XXL.")

  // Check 3: Security & Authorization Check for CMS Sync Endpoint
  console.log("\n[Check 3] Verifying API authorization enforcement on admin sync...")
  const unauthReq = {
    method: "POST",
    body: {
      action: "sync",
      key: "products",
      data: baselineProducts,
      adminToken: "WrongToken999",
    },
  }
  const unauthRes = mockRes()
  await handler(unauthReq, unauthRes)
  if (unauthRes.statusCode !== 401) {
    throw new Error(`Security violation: unauthenticated admin sync returned status ${unauthRes.statusCode} instead of 401!`)
  }
  console.log("[Check 3 PASS] API strictly rejected unauthorized admin sync with status 401.")

  // Check 4: Full Admin CMS Create Cycle with Preset & Custom Sizes and Price Tiers
  console.log("\n[Check 4] Testing full admin creation with custom/preset sizes and active/inactive price tiers...")
  const auditTestId = `prod-audit-m7-${Date.now()}`
  const auditTestProduct = {
    id: auditTestId,
    name: "Forensic Audit Verification Product",
    category: "Apparel",
    price: 850,
    stock: 12,
    img: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=500",
    alt: "Forensic Audit Product",
    description: "Product generated during independent forensic audit",
    sizes: ["S", "M", "L", "XL", "2XL", "XXL", "One Size", "Custom-5XL", "Tailored-Fit"],
    priceOptions: [
      { id: "opt-1", label: "Early Bird", price: 700, active: false },
      { id: "opt-2", label: "General Release", price: 850, active: true },
      { id: "opt-3", label: "VIP Box Set", price: 1500, active: true },
    ],
    featured: false,
    hidden: false,
  }

  const syncPayload = [auditTestProduct, ...baselineProducts]
  const createReq = {
    method: "POST",
    body: {
      action: "sync",
      key: "products",
      data: syncPayload,
      adminToken: "Zimthreads200",
    },
  }
  const createRes = mockRes()
  await handler(createReq, createRes)
  if (createRes.statusCode !== 200 || !createRes.body?.success) {
    throw new Error(`Admin sync failed with status ${createRes.statusCode}: ${JSON.stringify(createRes.body)}`)
  }

  // Verify directly from Neon DB SQL
  const readAfterCreate = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const savedAuditProduct = readAfterCreate[0]?.data?.find((p) => p.id === auditTestId)
  if (!savedAuditProduct) {
    throw new Error("Created product not found in Neon DB after sync!")
  }

  // Verify sizes fidelity
  if (savedAuditProduct.sizes.length !== 9) {
    throw new Error(`Sizes length mismatch: expected 9, got ${savedAuditProduct.sizes.length}`)
  }
  if (!savedAuditProduct.sizes.includes("Custom-5XL") || !savedAuditProduct.sizes.includes("Tailored-Fit")) {
    throw new Error("Custom size strings not preserved in Neon DB!")
  }

  // Verify price options fidelity
  if (!Array.isArray(savedAuditProduct.priceOptions) || savedAuditProduct.priceOptions.length !== 3) {
    throw new Error("Price options array corrupted in Neon DB!")
  }
  const earlyBird = savedAuditProduct.priceOptions.find((o) => o.id === "opt-1")
  const general = savedAuditProduct.priceOptions.find((o) => o.id === "opt-2")
  if (!earlyBird || earlyBird.active !== false) {
    throw new Error("Early bird tier (inactive) was not preserved as active: false")
  }
  if (!general || general.active !== true) {
    throw new Error("General release tier (active) was not preserved as active: true")
  }
  console.log("[Check 4 PASS] Sizes and price tiers successfully persisted to Neon DB with exact JSONB fidelity.")

  // Check 5: Edit Product (Toggle active state, add size, remove size)
  console.log("\n[Check 5] Testing admin product editing (size updates and price tier active toggle)...")
  const updatedAuditProduct = {
    ...savedAuditProduct,
    sizes: savedAuditProduct.sizes.filter((s) => s !== "Tailored-Fit").concat(["Bespoke-6XL"]),
    priceOptions: [
      { id: "opt-1", label: "Early Bird", price: 700, active: true }, // Toggled from false to true
      { id: "opt-2", label: "General Release", price: 850, active: false }, // Toggled from true to false
      { id: "opt-4", label: "Archival Collector Edition", price: 2200, active: true }, // New tier
    ],
  }

  const updatedPayload = readAfterCreate[0].data.map((p) => p.id === auditTestId ? updatedAuditProduct : p)
  const editReq = {
    method: "POST",
    body: {
      action: "sync",
      key: "products",
      data: updatedPayload,
      adminToken: "Zimthreads200",
    },
  }
  const editRes = mockRes()
  await handler(editReq, editRes)
  if (editRes.statusCode !== 200 || !editRes.body?.success) {
    throw new Error(`Admin edit sync failed: ${JSON.stringify(editRes.body)}`)
  }

  const readAfterEdit = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const savedEditedProduct = readAfterEdit[0]?.data?.find((p) => p.id === auditTestId)
  if (!savedEditedProduct) {
    throw new Error("Edited product not found in Neon DB!")
  }
  if (savedEditedProduct.sizes.includes("Tailored-Fit")) {
    throw new Error("Removed size 'Tailored-Fit' was not removed!")
  }
  if (!savedEditedProduct.sizes.includes("Bespoke-6XL")) {
    throw new Error("New custom size 'Bespoke-6XL' was not saved!")
  }
  const opt1 = savedEditedProduct.priceOptions.find((o) => o.id === "opt-1")
  const opt2 = savedEditedProduct.priceOptions.find((o) => o.id === "opt-2")
  const opt3 = savedEditedProduct.priceOptions.find((o) => o.id === "opt-3")
  const opt4 = savedEditedProduct.priceOptions.find((o) => o.id === "opt-4")
  if (opt1.active !== true) throw new Error("opt-1 active state toggle failed")
  if (opt2.active !== false) throw new Error("opt-2 active state toggle failed")
  if (opt3) throw new Error("opt-3 was not deleted")
  if (!opt4 || opt4.active !== true) throw new Error("opt-4 was not added with active: true")
  console.log("[Check 5 PASS] Product edit, size alterations, and price option state toggles verified in Neon DB.")

  // Check 6: Clean Up & Zero Residuals
  console.log("\n[Check 6] Cleaning up test records and restoring pristine baseline...")
  const cleanedList = readAfterEdit[0].data.filter((p) => p.id !== auditTestId)
  const cleanupReq = {
    method: "POST",
    body: {
      action: "sync",
      key: "products",
      data: cleanedList,
      adminToken: "Zimthreads200",
    },
  }
  const cleanupRes = mockRes()
  await handler(cleanupReq, cleanupRes)
  if (cleanupRes.statusCode !== 200 || !cleanupRes.body?.success) {
    throw new Error(`Cleanup failed: ${JSON.stringify(cleanupRes.body)}`)
  }

  const finalCheckRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'products';")
  const finalProducts = finalCheckRows[0]?.data
  if (!finalProducts || finalProducts.length !== baselineProducts.length) {
    throw new Error(`Residual count mismatch: expected ${baselineProducts.length}, got ${finalProducts?.length}`)
  }
  if (finalProducts.some((p) => p.id === auditTestId)) {
    throw new Error("Audit test product was not removed from Neon DB!")
  }
  console.log(`[Check 6 PASS] Zero residuals confirmed. Baseline restored to ${baselineProducts.length} items.`)

  console.log("\n=== INDEPENDENT FORENSIC AUDIT COMPLETE: ALL CHECKS PASSED ===")
}

runForensicAudit().catch((err) => {
  console.error("\n❌ Independent Forensic Audit FAILED:", err)
  process.exit(1)
})
