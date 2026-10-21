import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken, JWTPayload } from '@/lib/auth';
import { query } from '@/lib/db';

export interface TenantContext {
  user: JWTPayload | null;
  clinicId: string | null;
}

export function getTenantContext(request: NextRequest): TenantContext {
  const token = getTokenFromRequest(request);
  const user = token ? verifyToken(token) : null;
  if (!user) return { user: null, clinicId: null };

  if (user.role === 'superadmin') {
    const url = new URL(request.url);
    const paramClinic = url.searchParams.get('clinicId');
    if (paramClinic && paramClinic !== 'all') return { user, clinicId: paramClinic };

    const headerClinic = request.headers.get('x-clinic-id');
    if (headerClinic && headerClinic !== 'all') return { user, clinicId: headerClinic };

    const cookieClinic = request.cookies.get('active-clinic-id')?.value;
    if (cookieClinic && cookieClinic !== 'all') return { user, clinicId: cookieClinic };

    return { user, clinicId: user.clinicId || null };
  }

  return { user, clinicId: user.clinicId || null };
}

let cachedDefaultClinicId: string | null = null;
export async function getDefaultClinicId(): Promise<string> {
  if (cachedDefaultClinicId) return cachedDefaultClinicId;
  const res = await query(`SELECT id FROM clinics ORDER BY created_at ASC LIMIT 1;`);
  if (res.rows.length > 0) {
    cachedDefaultClinicId = res.rows[0].id;
    return cachedDefaultClinicId!;
  }
  return 'd420d949-160d-406f-a960-eb5cc59ce0d5';
}
