export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

/**
 * Fetches address data from ViaCEP API based on CEP
 * @param cep - Brazilian postal code (CEP) - accepts with or without formatting
 * @returns Address data or null if not found
 */
export const fetchAddressByCep = async (cep: string): Promise<AddressData | null> => {
  // Remove non-numeric characters
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      cep: data.cep,
    };
  } catch (error) {
    console.error('Error fetching address from ViaCEP:', error);
    return null;
  }
};

/**
 * Formats a CEP string to the pattern 99999-999
 * @param cep - Raw CEP string
 * @returns Formatted CEP string
 */
export const formatCep = (cep: string): string => {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length <= 5) {
    return cleanCep;
  }
  
  return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`;
};

/**
 * Validates if a CEP has the correct format (8 digits)
 * @param cep - CEP string to validate
 * @returns true if valid, false otherwise
 */
export const isValidCep = (cep: string): boolean => {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8;
};
