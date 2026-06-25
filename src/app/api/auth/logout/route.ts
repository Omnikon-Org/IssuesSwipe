import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(new URL('/', origin));
  
  response.cookies.set('session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
