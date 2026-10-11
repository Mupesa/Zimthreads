# DISPATCH: Milestone 2 Explorer 3 (Iteration 2) - Jackets Collection Modal Reactivity Strategy

## Context
Reviewer 2 identified that `JacketsCollectionPage.tsx` passes a static snapshot `product={selectedProduct}` to `ProductModal` rather than dynamically deriving `liveSelectedProduct` from `useStore().products` like `Shop.tsx` does.

## Objective
Recommend concrete changes for `src/pages/JacketsCollectionPage.tsx` (and any other jackets collection page/component) to ensure:
1. `selectedProduct` ID is tracked, and `liveSelectedProduct` is memoized against `products` from `useStore()`.
2. Any changes in stock or price while the modal is open or when re-opened immediately reflect live store state.

## Authoritative Inputs
- `c:\Dev\Active Projects\Zimthreads\PROJECT.md`
- `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md`
- `src/pages/JacketsCollectionPage.tsx`
- `src/pages/Shop.tsx`

## Output
Write fix strategy to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\strategy.md` and handoff to `c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\handoff.md`.
Report completion via send_message.


## 2026-10-10T19:14:07Z
You are Explorer 3 for Milestone 2 Iteration 2.
Your working directory is c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3.
Read your instructions in:
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\DISPATCH.md
- c:\Dev\Active Projects\Zimthreads\PROJECT.md
- c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_reviewer_2\review.md
- src/pages/JacketsCollectionPage.tsx
- src/pages/Shop.tsx

Formulate the fix strategy for JacketsCollectionPage.tsx to dynamically derive liveSelectedProduct for ProductModal.
Write strategy to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\strategy.md and handoff report to c:\Dev\Active Projects\Zimthreads\.agents\teamwork\m2_explorer_iter2_3\handoff.md.
Report completion via send_message.
