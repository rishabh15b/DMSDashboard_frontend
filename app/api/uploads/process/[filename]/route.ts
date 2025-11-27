import { NextResponse } from "next/server";

// Force dynamic rendering - this route should not be statically generated
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Params {
  params: { filename: string };
}

export async function POST(_: Request, { params }: Params) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "Backend API URL not configured" },
      { status: 503 }
    );
  }

  try {
    // Decode the filename in case it was URL encoded
    const filename = decodeURIComponent(params.filename);
    
    const response = await fetch(`${BACKEND_URL}/api/uploads/process/${encodeURIComponent(filename)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(60000), // 60 seconds for processing
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        const errorText = await response.text().catch(() => `Status ${response.status}`);
        errorData = { detail: errorText };
      }
      
      // Preserve the error structure from backend
      return NextResponse.json(
        {
          ...errorData,
          error: errorData.detail || errorData.error || `Processing failed with status ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error processing PDF from backend:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}

