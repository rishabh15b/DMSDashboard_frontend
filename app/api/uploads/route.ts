import { NextResponse } from "next/server";

// Force dynamic rendering - this route should not be statically generated
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "Backend API URL not configured" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    
    // Forward the form data to the backend
    // Important: Don't set Content-Type header - let fetch set it automatically for FormData
    const response = await fetch(`${BACKEND_URL}/api/uploads/`, {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(60000), // 60 seconds for upload
      // Don't set headers - fetch will automatically set Content-Type with boundary for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Status ${response.status}` }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error uploading files to backend:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
