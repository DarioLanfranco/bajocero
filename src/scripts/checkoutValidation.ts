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

export function sanitize(v: string): string {
  return v.replace(/[<>]/g, '').trim();
}

export function validateCheckoutForm(data: CheckoutFormData): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!sanitize(data.name)) {
    errors.name = 'El nombre es obligatorio';
  }

  if (data.deliveryMode === 'envio' && !sanitize(data.address)) {
    errors.address = 'La dirección es obligatoria para envío';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
