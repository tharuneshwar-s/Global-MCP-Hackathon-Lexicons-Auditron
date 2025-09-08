import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// Simple in-memory rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // Max requests per window

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(userId) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(userId, recentRequests);
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('GET Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.log('GET Authentication failed:', { authError, user });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }    const { data: credentials, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      credentials: credentials || {
        aws_credentials: null,
        azure_credentials: null,
        gcp_credentials: null
      }
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('Auth check:', { user: user?.id, authError });

    if (authError || !user) {
      console.log('Authentication failed:', { authError, user });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }    const body = await request.json();
    const { aws_credentials, azure_credentials, gcp_credentials } = body;

    // Validate credentials format
    if (aws_credentials && (!aws_credentials.access_key_id || !aws_credentials.secret_access_key)) {
      return NextResponse.json({ error: 'Invalid AWS credentials format' }, { status: 400 });
    }

    if (azure_credentials && (!azure_credentials.tenant_id || !azure_credentials.client_id || !azure_credentials.client_secret || !azure_credentials.subscription_id)) {
      return NextResponse.json({ error: 'Invalid Azure credentials format' }, { status: 400 });
    }

    if (gcp_credentials && (!gcp_credentials.type || !gcp_credentials.project_id)) {
      return NextResponse.json({ error: 'Invalid GCP credentials format' }, { status: 400 });
    }

    // Try to update first
    const { data: existingCredentials } = await supabase
      .from('credentials')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log("Existing credentials:", existingCredentials);

    let result;
    if (existingCredentials) {
      // Update existing credentials
      const updateData: any = {};
      if (aws_credentials !== undefined) updateData.aws_credentials = aws_credentials;
      if (azure_credentials !== undefined) updateData.azure_credentials = azure_credentials;
      if (gcp_credentials !== undefined) updateData.gcp_credentials = gcp_credentials;

      const { data, error } = await supabase
        .from('credentials')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Insert new credentials
      const { data, error } = await supabase
        .from('credentials')
        .insert({
          user_id: user.id,
          aws_credentials,
          azure_credentials,
          gcp_credentials
        })
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      credentials: result.data 
    });
  } catch (error) {
    console.error('Error saving credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Same logic as POST
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
