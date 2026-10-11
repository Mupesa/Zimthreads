# DISPATCH: Explorer 2 - Customer-Facing Flows & Data Integration

## Objective
Investigate all customer-facing flows, routes, forms, and catalogs to determine how customer submissions and data loading currently operate.

## Authoritative Inputs
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md`
- `c:\Dev\Active Projects\Zimthreads\AGENTS.md`
- `src/` (especially pages `/booking`, `/contact`, `/shop`, `/collection/racing-jackets`, and Cart/Checkout components)

## Investigation Checklist
1. Booking flow: form fields, validation, submission handler, where data currently goes.
2. Checkout/Order flow: cart structure, order placement, customer shipping details, items stored, payment/fulfillment status defaults.
3. Contact flow: inquiry form fields, submission handler.
4. Shop & Racing Jackets catalog: how products are currently fetched or imported (static JSON, mock constants, etc.), how price/stock updates from DB can be reflected on `/shop` and `/collection/racing-jackets`.

## Rules & Constraints
- Read-only exploration. DO NOT edit source code or test files.
- Report exact file paths, line references, state models, and endpoints needed.

## Output
Write your findings to:
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2\survey_customer_flows.md`
and complete your handoff report in:
`c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2\handoff.md`.
Then send a completion message with summary and artifact path.


## 2026-10-10T18:10:39Z
You are Explorer 2 (Customer Flows Explorer).
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\ORIGINAL_REQUEST.md
- c:\Dev\Active Projects\Zimthreads\AGENTS.md

Investigate all customer-facing flows and pages: /booking, cart & checkout, /contact, /shop, and /collection/racing-jackets. Analyze how customer submissions are handled, what data models are used, where mock/static data lives, and how live DB loading should be wired.
Do NOT modify any code.
Write your complete findings report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2\survey_customer_flows.md and handoff report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\explorer_survey_2\handoff.md.
Then use send_message to report your completion to your parent.
