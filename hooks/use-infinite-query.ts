"use client"

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import type { PostgrestError } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

type SupabaseTableName = string
type SupabaseSelectQuery = {
  eq: (column: string, value: unknown) => SupabaseSelectQuery
  neq: (column: string, value: unknown) => SupabaseSelectQuery
  gt: (column: string, value: unknown) => SupabaseSelectQuery
  gte: (column: string, value: unknown) => SupabaseSelectQuery
  lt: (column: string, value: unknown) => SupabaseSelectQuery
  lte: (column: string, value: unknown) => SupabaseSelectQuery
  ilike: (column: string, pattern: string) => SupabaseSelectQuery
  order: (
    column: string,
    options?: {
      ascending?: boolean
      nullsFirst?: boolean
      foreignTable?: string
      referencedTable?: string
    }
  ) => SupabaseSelectQuery
  range: (
    from: number,
    to: number
  ) => PromiseLike<{
    data: unknown[] | null
    count: number | null
    error: PostgrestError | null
  }>
}

type SupabaseQueryHandler = (query: SupabaseSelectQuery) => SupabaseSelectQuery

type UseInfiniteQueryProps = {
  tableName: SupabaseTableName
  columns?: string
  pageSize?: number
  trailingQuery?: SupabaseQueryHandler
  queryKey?: string
}

type StoreState<TData> = {
  data: TData[]
  count: number
  isSuccess: boolean
  isLoading: boolean
  isFetching: boolean
  error: PostgrestError | null
  hasInitialFetch: boolean
}

type Listener = () => void

const initialState = {
  data: [],
  count: 0,
  isSuccess: false,
  isLoading: false,
  isFetching: false,
  error: null,
  hasInitialFetch: false,
} satisfies StoreState<unknown>

function getItemKey(item: unknown, fallback: number) {
  if (item && typeof item === "object" && "id" in item) {
    const id = (item as { id?: unknown }).id
    if (typeof id === "string" || typeof id === "number") {
      return id
    }
  }

  return `index-${fallback}`
}

function mergeUniqueRows<TData>(currentRows: TData[], nextRows: TData[]) {
  const seen = new Set<unknown>()

  return [...currentRows, ...nextRows].filter((item, index) => {
    const key = getItemKey(item, index)
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function createStore<TData>(props: UseInfiniteQueryProps) {
  const { tableName, columns = "*", pageSize = 20, trailingQuery } = props

  let state: StoreState<TData> = {
    data: [],
    count: 0,
    isSuccess: false,
    isLoading: false,
    isFetching: false,
    error: null,
    hasInitialFetch: false,
  }

  const listeners = new Set<Listener>()

  function notify() {
    listeners.forEach((listener) => listener())
  }

  function setState(nextState: Partial<StoreState<TData>>) {
    state = { ...state, ...nextState }
    notify()
  }

  async function fetchPage(skip: number) {
    if (state.hasInitialFetch && (state.isFetching || state.count <= state.data.length)) {
      return
    }

    setState({ isFetching: true })

    let query = supabase.from(tableName).select(columns, { count: "exact" }) as unknown as SupabaseSelectQuery

    if (trailingQuery) {
      query = trailingQuery(query)
    }

    const { data: rows, count, error } = await query.range(skip, skip + pageSize - 1)

    if (error) {
      setState({ error, isFetching: false })
      return
    }

    setState({
      data: mergeUniqueRows(state.data, (rows ?? []) as TData[]),
      count: count ?? 0,
      isSuccess: true,
      error: null,
      isFetching: false,
    })
  }

  async function fetchNextPage() {
    if (state.isFetching) {
      return
    }

    await fetchPage(state.data.length)
  }

  async function initialize() {
    setState({ isLoading: true, isSuccess: false, data: [], error: null })
    await fetchNextPage()
    setState({ isLoading: false, hasInitialFetch: true })
  }

  return {
    getState: () => state,
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    fetchNextPage,
    initialize,
  }
}

export function useInfiniteQuery<TData>(props: UseInfiniteQueryProps) {
  const {
    columns,
    pageSize,
    queryKey,
    tableName,
    trailingQuery,
  } = props
  const store = useMemo(
    () => createStore<TData>({ columns, pageSize, queryKey, tableName, trailingQuery }),
    [columns, pageSize, queryKey, tableName, trailingQuery]
  )

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    () => initialState as StoreState<TData>
  )

  useEffect(() => {
    if (!state.hasInitialFetch) {
      void store.initialize()
    }
  }, [state.hasInitialFetch, store])

  const fetchNextPage = useCallback(() => {
    void store.fetchNextPage()
  }, [store])

  return {
    data: state.data,
    count: state.count,
    isSuccess: state.isSuccess,
    isLoading: state.isLoading,
    isFetching: state.isFetching,
    error: state.error,
    hasMore: state.count > state.data.length,
    fetchNextPage,
  }
}

export type { SupabaseQueryHandler, UseInfiniteQueryProps }
