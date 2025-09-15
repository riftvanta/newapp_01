import dynamic from 'next/dynamic'
import type { Account } from "@prisma/client"

interface AccountsClientProps {
  accounts: (Account & {
    parent?: Account | null
    children?: Account[]
  })[]
}

// Dynamically import the client component with SSR disabled
// No loading state for a cleaner experience
export const AccountsClient = dynamic(
  () => import('./accounts-client-impl').then(mod => ({
    default: mod.AccountsClientImpl
  })),
  {
    ssr: false
  }
) as React.ComponentType<AccountsClientProps>