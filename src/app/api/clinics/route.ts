import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isDbConfigured } from '@/lib/db';
import { withAuth, JWTPayload, getTokenFromRequest, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/clinics - list clinics
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ clinics: [] });
    }

    const res = await query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM patients p WHERE p.clinic_id = c.id) as patient_count,
        (SELECT COUNT(*) FROM doctors d WHERE d.clinic_id = c.id) as doctor_count,
        (SELECT COUNT(*) FROM appointments a WHERE a.clinic_id = c.id) as appointment_count,
        (SELECT COALESCE(SUM(amount), 0) FROM payments py WHERE py.clinic_id = c.id) as total_revenue
      FROM clinics c
      ORDER BY c.created_at DESC;
    `);
    return NextResponse.json({ clinics: res.rows });
  } catch (error: any) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch clinics' }, { status: 500 });
  }
});

// POST /api/clinics - register new clinic (open to all authenticated users and new clinic registrations)
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const currentUser = token ? verifyToken(token) : null;

    const body = await request.json();
    const {
      name,
      slug,
      email,
      phone,
      address,
      city,
      subscriptionPlan,
      adminFullName,
      adminUsername,
      adminEmail,
      adminPassword,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Clinic name is required' }, { status: 400 });
    }

    // Generate slug if not provided
    const cleanSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check slug uniqueness
    const existing = await query(`SELECT id FROM clinics WHERE slug = $1 LIMIT 1`, [cleanSlug]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'A clinic with this URL slug already exists' }, { status: 400 });
    }

    // 1. Insert clinic
    const clinicRes = await query(
      `INSERT INTO clinics (name, slug, email, phone, address, city, status, subscription_plan)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
       RETURNING *;`,
      [
        name.trim(),
        cleanSlug,
        email || null,
        phone || null,
        address || null,
        city || null,
        subscriptionPlan || 'pro',
      ]
    );

    const newClinic = clinicRes.rows[0];

    // 2. Create clinic admin user if provided, or if logged in without credentials
    let newAdmin = null;
    const targetEmail = adminEmail || (currentUser && !currentUser.clinicId ? currentUser.email : null);
    const targetPassword = adminPassword || 'admin123';

    if (adminEmail && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const userRes = await query(
        `INSERT INTO users (username, email, password_hash, full_name, role, clinic_id, is_active)
         VALUES ($1, $2, $3, $4, 'admin', $5, true)
         ON CONFLICT (email) DO UPDATE SET clinic_id = $5, role = 'admin'
         RETURNING id, username, email, full_name, role, clinic_id;`,
        [
          adminUsername || adminEmail.split('@')[0],
          adminEmail.toLowerCase().trim(),
          passwordHash,
          adminFullName || `${name} Admin`,
          newClinic.id,
        ]
      );
      newAdmin = userRes.rows[0];
    } else if (currentUser) {
      // Associate with current user
      await query(`UPDATE users SET clinic_id = COALESCE(clinic_id, $1) WHERE id = $2`, [newClinic.id, currentUser.userId]);
    }

    // 3. Seed starter treatments for the new clinic
    await query(
      `INSERT INTO treatments (clinic_id, name, category, description, duration_minutes, cost, is_active)
       VALUES 
        ($1, 'Dental Examination & Consultation', 'General', 'Comprehensive oral checkup and diagnosis', 30, 25.00, true),
        ($1, 'Dental Cleaning & Polishing', 'Preventive', 'Ultrasonic scaling and tartar removal', 45, 40.00, true),
        ($1, 'Tooth Extraction (Simple)', 'Surgery', 'Routine tooth extraction with local anesthesia', 30, 50.00, true),
        ($1, 'Composite Tooth Filling', 'Restorative', 'Tooth-colored composite restoration', 45, 60.00, true),
        ($1, 'Root Canal Treatment (Molar)', 'Endodontics', 'Complete root canal therapy and filling', 60, 180.00, true),
        ($1, 'Teeth Whitening (In-Office)', 'Cosmetic', 'Professional laser teeth bleaching session', 60, 150.00, true);`,
      [newClinic.id]
    );

    // If an unauthenticated user signed up, log them in automatically
    if (newAdmin && !currentUser) {
      const { signToken } = await import('@/lib/auth');
      const tokenString = signToken({
        userId: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        fullName: newAdmin.full_name,
        username: newAdmin.username,
        clinicId: newClinic.id,
        clinicName: newClinic.name,
      });

      const response = NextResponse.json({
        success: true,
        clinic: newClinic,
        admin: newAdmin,
      }, { status: 201 });

      response.cookies.set('auth-token', tokenString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      clinic: newClinic,
      admin: newAdmin,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating clinic:', error);
    return NextResponse.json({ error: error.message || 'Failed to create clinic' }, { status: 500 });
  }
}
