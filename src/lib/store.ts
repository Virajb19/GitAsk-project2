import { create } from 'zustand'

type useSearchQuery = {
    query: string,
    setQuery: (query: string) => void
  }

type loadingState = {
    loading: boolean,
    setLoading: (value: boolean) => void
}

type SidebarState = {
  isCollapsed: boolean
  toggleSidebar: () => void,
  collapseSideBar: () => void
}

type refetchingState = {
  isRefetching: boolean,
  setIsRefetching: (value: boolean) => void
}

export const useIsRefetching = create<refetchingState>((set,get) => ({
  isRefetching: false,
  setIsRefetching: (value: boolean) => {
     set({isRefetching: value})
  }
}))
  
export const useSearchQuery = create<useSearchQuery>((set, get) => ({
       query: '',
       setQuery: (query: string) => {
         set({query})
       }
  }))

export const useLoadingState = create<loadingState>((set, get) => ({
     loading: false,
     setLoading: (value: boolean) => {
        set({ loading: value})
     }
}))

export const useSidebarState = create<SidebarState>((set,get) => ({
  isCollapsed: false,
  toggleSidebar: () => {
    set({isCollapsed: !get().isCollapsed})
 },
  collapseSideBar: () => {
    set({isCollapsed: true})
  }
}))
  