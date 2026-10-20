import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Fallback authentication if database setup is postponed
    if (!isSupabaseConfigured()) {
      if (
        (cleanEmail === 'admin@dental.com' || cleanEmail === 'admin') &&
        (password === 'admin123' || password === 'admin')
      ) {
        const token = signToken({
          userId: 'mock-admin-id',
          email: 'admin@dental.com',
          role: 'admin',
          fullName: 'Dr. System Administrator',
        });

        const response = NextResponse.json({
          token,
          user: {
            id: 'mock-admin-id',
            email: 'admin@dental.com',
            fullName: 'Dr. System Administrator',
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
      return NextResponse.json({ error: 'Invalid email or password. (Default: admin@dental.com / admin123)' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
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
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
