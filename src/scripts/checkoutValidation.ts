export interface CheckoutFormData {
  name: string;
  deliveryMode: string;
  address: string;
  paymentMethod: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CheckoutFormData, string>>;
}

export function validateCheckoutForm(data: CheckoutFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!data.name.trim()) {
    errors.name = 'El nombre es obligatorio';
  }

  if (data.deliveryMode === 'envio' && !data.address.trim()) {
    errors.address = 'La dirección es obligatoria para envío';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
