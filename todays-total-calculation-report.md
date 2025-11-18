# Report: Calculation of "Today's Total"

This document outlines the process by which the "Today's Total" value, displayed in the `CompactDailyStats` component, is calculated within the Soko Minimart application.

## 1. Display Component: `CompactDailyStats.tsx`

The value is rendered in the `CompactDailyStats` component, where it is passed in as the `dailyStats.totalSales` prop.

-   **File**: `src/components/pos/CompactDailyStats.tsx`
-   **Code Snippet**:
    ```tsx
    <span><strong>Today's Total:</strong> {formatCurrency(dailyStats.totalSales)}</span>
    ```

## 2. Data Provider: `CashierPosPage.tsx`

The `CompactDailyStats` component is used in the `CashierPosPage`, which is responsible for fetching the `dailyStats` object and passing it as a prop.

-   **File**: `src/pages/CashierPosPage.tsx`
-   **Fetching Logic**: The page uses the `useDailyStats` hook to retrieve the data.
    ```tsx
    const { data: dailyStats } = useDailyStats(profile?.id);
    ```

## 3. Data Fetching Logic: `queries.ts`

The core logic for fetching the sales data resides in the `useDailyStats` hook and the `fetchDailyStats` function.

-   **File**: `src/lib/queries.ts`
-   **Hook**: `useDailyStats`
    -   This hook wraps the `fetchDailyStats` function with `useQuery` from TanStack Query to manage data fetching, caching, and state.
-   **Function**: `fetchDailyStats(cashierId?: string)`
    -   This asynchronous function is responsible for the actual calculation.

### Calculation Steps in `fetchDailyStats`:

1.  **Get Current Date**: The function starts by getting the current date in ISO format (`YYYY-MM-DD`) to filter database records.

2.  **Fetch General Daily Stats**: It first queries the `daily_stats` table to see if a pre-calculated total for the day already exists.

    ```sql
    -- Simplified SQL representation
    SELECT * FROM daily_stats WHERE date = 'YYYY-MM-DD';
    ```

3.  **Fetch Cashier-Specific Sales**: If a `cashierId` is provided, the function queries the `sales` table to get all sales made by that specific cashier on the current day.

    ```sql
    -- Simplified SQL representation
    SELECT total_amount FROM sales WHERE cashier_id = 'some-cashier-id' AND created_at >= 'YYYY-MM-DD T00:00:00' AND created_at < 'YYYY-MM-DD T23:59:59';
    ```

4.  **Sum the Sales**: The `total_amount` from each sale record is summed up to get the total sales for the cashier.

5.  **Return the Final Value**: The function returns an object where `totalSales` is set to the `cashierSales` if available. If not, it falls back to the `total_sales` from the `daily_stats` table. If neither value exists, it defaults to `0`.

This multi-step process ensures that the "Today's Total" value is accurate and specific to the logged-in cashier, while also providing a general daily total as a fallback.
