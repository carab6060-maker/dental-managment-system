import { NextRequest } from 'next/server';
import { JWTPayload } from '@/lib/auth';

/**
 * Resolves the effective clinic ID for a request.
 * - Superadmins can inspect any clinic via ?clinicId=, X-Clinic-Id header, or cookie.
 * - Non-superadmins are strictly locked to their assigned clinicId.
 */
export function getEffectiveClinicId(request: NextRequest, user: JWTPayload): string | null {
  if (user.role === 'superadmin') {
    const url = new URL(request.url);
    const paramClinic = url.searchParams.get('clinicId');
    if (paramClinic && paramClinic !== 'all') return paramClinic;

    const headerClinic = request.headers.get('x-clinic-id');
    if (headerClinic && headerClinic !== 'all') return headerClinic;

    const cookieClinic = request.cookies.get('active-clinic-id')?.value;
    if (cookieClinic && cookieClinic !== 'all') return cookieClinic;

    // Default to the user's default clinic if assigned, or null for all clinics
    return user.clinicId || null;
  }

  return user.clinicId || null;
}
