// Simple JWT token generator for development
// In production, use a proper JWT library like 'jsonwebtoken'

export function createJWT(payload: any, secret: string = 'your-secret-key'): string {
  // Simple JWT creation (not cryptographically secure, for development only)
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // For development, we'll create a simple signature
  // In production, use proper HMAC-SHA256
  const signature = btoa(JSON.stringify({ secret, payload: encodedPayload }));
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string, secret: string = 'your-secret-key'): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
