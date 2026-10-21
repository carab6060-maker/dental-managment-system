import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, isDbConfigured } from '@/lib/db';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.usernameOrEmail || body.username || body.email || '').toString().trim().toLowerCase();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Username/email and password are required' }, { status: 400 });
    }

    if (isDbConfigured()) {
      const res = await query(
        `SELECT * FROM users 
         WHERE (LOWER(email) = $1 OR LOWER(username) = $1) 
           AND is_active = true 
         LIMIT 1`,
        [identifier]
      );

      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
      }

      const user = res.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        username: user.username || undefined,
        role: user.role,
        fullName: user.full_name,
      });

      const response = NextResponse.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      });

      return response;
    }

    // Fallback if DB is not configured
    const isSuperAdmin = identifier === 'superadmin' || identifier === 'superadmin@dental.com';
    const isAdmin = identifier === 'admin' || identifier === 'admin@dental.com';

    if ((isSuperAdmin || isAdmin) && (password === 'admin123' || password === 'admin')) {
      const token = signToken({
        userId: isSuperAdmin ? 'mock-superadmin-id' : 'mock-admin-id',
        username: isSuperAdmin ? 'superadmin' : 'admin',
        email: isSuperAdmin ? 'superadmin@dental.com' : 'admin@dental.com',
        role: 'admin',
        fullName: isSuperAdmin ? 'Super Administrator' : 'System Administrator',
      });

      const response = NextResponse.json({
        token,
        user: {
          id: isSuperAdmin ? 'mock-superadmin-id' : 'mock-admin-id',
          username: isSuperAdmin ? 'superadmin' : 'admin',
          email: isSuperAdmin ? 'superadmin@dental.com' : 'admin@dental.com',
          fullName: isSuperAdmin ? 'Super Administrator' : 'System Administrator',
          role: 'admin',
        },
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
