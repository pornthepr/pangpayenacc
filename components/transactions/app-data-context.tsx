"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/database.types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface AppDataValue {
  accounts: Account[];
  categories: Category[];
  profiles: Profile[];
  currentProfileId: string;
  quickAdd: {
    open: boolean;
    editingTransaction: Transaction | null;
    forcedType: "income" | "expense" | "transfer" | null;
    openCreate: (type?: "income" | "expense" | "transfer") => void;
    openEdit: (transaction: Transaction) => void;
    close: () => void;
  };
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({
  accounts,
  categories,
  profiles,
  currentProfileId,
  children,
}: {
  accounts: Account[];
  categories: Category[];
  profiles: Profile[];
  currentProfileId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [forcedType, setForcedType] = useState<"income" | "expense" | "transfer" | null>(null);

  const value = useMemo<AppDataValue>(
    () => ({
      accounts,
      categories,
      profiles,
      currentProfileId,
      quickAdd: {
        open,
        editingTransaction,
        forcedType,
        openCreate: (type) => {
          setEditingTransaction(null);
          setForcedType(type ?? "expense");
          setOpen(true);
        },
        openEdit: (transaction) => {
          setEditingTransaction(transaction);
          setForcedType(null);
          setOpen(true);
        },
        close: () => setOpen(false),
      },
    }),
    [accounts, categories, profiles, currentProfileId, open, editingTransaction, forcedType]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
