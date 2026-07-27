import { createContext, useContext, ReactNode } from 'react';

type AdminEditingContextType = {
  isEditing: boolean;
  onTextChange: (fieldPath: string, newValue: string) => void;
  onImageChange: (fieldPath: string, newSrc: string) => void;
};

const AdminEditingContext = createContext<AdminEditingContextType | null>(null);

export function AdminEditingProvider({ children, isEditing, onTextChange, onImageChange }: {
  children: ReactNode;
  isEditing: boolean;
  onTextChange: (fieldPath: string, newValue: string) => void;
  onImageChange: (fieldPath: string, newSrc: string) => void;
}) {
  return (
    <AdminEditingContext.Provider value={{ isEditing, onTextChange, onImageChange }}>
      {children}
    </AdminEditingContext.Provider>
  );
}

export function useAdminEditing() {
  const context = useContext(AdminEditingContext);
  if (!context) {
    return { isEditing: false, onTextChange: () => {}, onImageChange: () => {} };
  }
  return context;
}
