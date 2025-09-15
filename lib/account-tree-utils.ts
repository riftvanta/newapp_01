import { Account } from "@prisma/client"

export interface TreeAccount extends Account {
  parent?: Account | null
  children?: Account[]
}

export interface TreeNode {
  account: TreeAccount
  children: TreeNode[]
  level: number
  isExpanded?: boolean
}

export function buildAccountTree(accounts: TreeAccount[]): TreeNode[] {
  const accountMap = new Map<string, TreeAccount>()
  const rootNodes: TreeNode[] = []

  // First pass: Create a map of all accounts
  accounts.forEach(account => {
    accountMap.set(account.id, account)
  })

  // Second pass: Build the tree structure
  const processedIds = new Set<string>()

  // Start with root level parent accounts (no parentId)
  accounts
    .filter(account => !account.parentId && account.isParent)
    .forEach(account => {
      const node = buildTreeNode(account, accountMap, processedIds, 0)
      if (node) {
        rootNodes.push(node)
      }
    })

  // Add any orphaned accounts (non-parent accounts without parentId)
  accounts
    .filter(account => !account.parentId && !account.isParent && !processedIds.has(account.id))
    .forEach(account => {
      rootNodes.push({
        account,
        children: [],
        level: 0
      })
      processedIds.add(account.id)
    })

  return rootNodes
}

function buildTreeNode(
  account: TreeAccount,
  accountMap: Map<string, TreeAccount>,
  processedIds: Set<string>,
  level: number
): TreeNode | null {
  if (processedIds.has(account.id)) {
    return null
  }

  processedIds.add(account.id)

  const children: TreeNode[] = []

  // Find all children of this account
  if (account.children && account.children.length > 0) {
    account.children.forEach(child => {
      const childAccount = accountMap.get(child.id)
      if (childAccount) {
        const childNode = buildTreeNode(childAccount, accountMap, processedIds, level + 1)
        if (childNode) {
          children.push(childNode)
        }
      }
    })
  }

  // Sort children by code
  children.sort((a, b) => a.account.code.localeCompare(b.account.code))

  return {
    account,
    children,
    level
  }
}

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const flattened: TreeNode[] = []

  function flatten(node: TreeNode) {
    flattened.push(node)
    if (node.children && node.children.length > 0) {
      node.children.forEach(flatten)
    }
  }

  nodes.forEach(flatten)
  return flattened
}

export function searchAccounts(
  nodes: TreeNode[],
  searchTerm: string
): TreeNode[] {
  if (!searchTerm.trim()) {
    return nodes
  }

  const term = searchTerm.toLowerCase()
  const matchedNodes: TreeNode[] = []

  function searchNode(node: TreeNode): boolean {
    const account = node.account
    const matches =
      account.code.toLowerCase().includes(term) ||
      account.nameAr.toLowerCase().includes(term)

    let hasMatchingChildren = false
    const filteredChildren: TreeNode[] = []

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        if (searchNode(child)) {
          filteredChildren.push(child)
          hasMatchingChildren = true
        }
      })
    }

    if (matches || hasMatchingChildren) {
      matchedNodes.push({
        ...node,
        children: filteredChildren,
        isExpanded: hasMatchingChildren // Auto-expand if children match
      })
      return true
    }

    return false
  }

  nodes.forEach(searchNode)
  return matchedNodes
}

export function getExpandedState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}

  const stored = localStorage.getItem('accountTreeExpanded')
  return stored ? JSON.parse(stored) : {}
}

export function saveExpandedState(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return

  localStorage.setItem('accountTreeExpanded', JSON.stringify(state))
}

export function getViewMode(): 'grid' | 'tree' {
  if (typeof window === 'undefined') return 'grid'

  const stored = localStorage.getItem('accountViewMode')
  return stored === 'tree' ? 'tree' : 'grid'
}

export function saveViewMode(mode: 'grid' | 'tree') {
  if (typeof window === 'undefined') return

  localStorage.setItem('accountViewMode', mode)
}