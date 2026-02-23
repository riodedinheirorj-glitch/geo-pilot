import { useState, useCallback } from "react";

export interface AddressData {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  status?: string;
  volumes?: number;
  sequence?: number;
  recipient?: string;
  atId?: string;
  spxTn?: string;
  bairro?: string;
  city?: string;
  zipcode?: string;
}

interface UseExcelUploadOptions {
  onSheetProcessed?: (info: { fileName: string; addressesCount: number; uploadedAt: Date }) => void;
  onUploadSuccess?: (info: { total: number }) => void;
}

export function useExcelUpload(options?: UseExcelUploadOptions) {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    // Stub implementation
    setIsProcessing(false);
  }, []);

  const clearAddresses = useCallback(() => setAddresses([]), []);
  const removeAddressById = useCallback((id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  }, []);
  const updateAddressById = useCallback((id: string, data: Partial<AddressData>) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);
  const updateAddressLocationById = useCallback((id: string, lat: number, lng: number) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, lat, lng } : a));
  }, []);

  return { addresses, isProcessing, handleFileUpload, clearAddresses, removeAddressById, updateAddressById, updateAddressLocationById };
}
